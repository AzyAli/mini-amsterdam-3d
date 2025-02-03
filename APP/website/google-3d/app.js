/* global fetch, requestAnimationFrame, cancelAnimationFrame */
// import {Log} from '@deck.gl/core';
// Log.enableLogs('deck'); // Enable detailed Deck.gl logs
import {GoogleMapsOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import {Loader} from '@googlemaps/js-api-loader';
import TripBuilder from './trip-builder';

const LINE_INFO = {
  // Metro
  M50: {type: 'METRO', direction: 'Isolatorweg - Gein'},
  M51: {type: 'METRO', direction: 'Isolatorweg - Centraal Station'},
  M52: {type: 'METRO', direction: 'Noord - Station Zuid'},
  M53: {type: 'METRO', direction: 'Gaasperplas - Centraal Station'},
  M54: {type: 'METRO', direction: 'Gein - Centraal Station'},
  // Ferry
  F1: {type: 'FERRY', direction: 'Zamenhofstraat - Azartplein'},
  F2: {type: 'FERRY', direction: 'IJplein - Centraal Station'},
  F3: {type: 'FERRY', direction: 'Buiksloterweg - Centraal Station'},
  // Night bus
  N81: {type: 'BUS', direction: 'Centraal Station - Sloterdijk'},
  N82: {type: 'BUS', direction: 'Centraal Station - Geuzenveld'},
  // Regular bus
  15: {type: 'BUS', direction: 'Station Sloterdijk - Station Zuid'},
  18: {type: 'BUS', direction: 'Centraal Station - Slotervaart'},
  21: {type: 'BUS', direction: 'Centraal Station - Geuzenveld'},
  22: {type: 'BUS', direction: 'Station Sloterdijk - Muiderpoortstation'},
  // Tram
  1: {type: 'TRAM', direction: 'Matterhorn - Plantage Parklaan'},
  2: {type: 'TRAM', direction: 'Oudenaardeplantsoen - Centraal Station'},
  3: {type: 'TRAM', direction: 'Flevopark - Frederik Hendrikplantsoen'},
  4: {type: 'TRAM', direction: 'Drentepark - Centraal Station'},
  5: {type: 'TRAM', direction: 'Amstelveen Binnenhof - Centraal Station'},
  6: {type: 'TRAM', direction: 'Amstelveen Stadshart - Station Zuid'},
  7: {type: 'TRAM', direction: 'Sloterpark - Azartplein'},
  12: {type: 'TRAM', direction: 'Amstelstation - Centraal Station'},
  13: {type: 'TRAM', direction: 'Lambertus Zijlplein - Centraal Station'},
  14: {type: 'TRAM', direction: 'Centraal Station - Javaplein'},
  17: {type: 'TRAM', direction: 'Dijkgraafplein - Centraal Station'},
  19: {type: 'TRAM', direction: 'Van Hallstraat - Diemen Sniep'},
  24: {type: 'TRAM', direction: 'De Boelelaan/VU - Frederiksplein'},
  25: {type: 'TRAM', direction: 'Uithoorn Centrum - Station Zuid'},
  26: {type: 'TRAM', direction: 'Centraal Station - IJburg'},
  27: {type: 'TRAM', direction: 'Dijkgraafplein - Surinameplein'},
};

const GOOGLE_MAPS_API_KEY = '';
const GOOGLE_MAP_ID = '';
const MY_DARK_3D_MAP_ID = '';
const AMSTERDAM_CENTER = {lng: 4.9041, lat: 52.3676};

// const DATA_URL = './data/amsterdam-trips old.json';
const MODEL_URL = './models/truck/scene.gltf';
const ROADS_URL = './data/amsterdam roads.geojson';

// Add constants
const VEHICLE_COLORS = {
  BUS: [255, 0, 0],    // Red
  TRAM: [0, 255, 0],   // Green
  // METRO: [0, 0, 255],  // Blue
  // FERRY: [255, 165, 0], // Orange
  // DEFAULT: [150, 150, 150]
};


// Replace ZMQ connection with WebSocket
async function createGVBSocket() {
  const ws = new WebSocket('ws://localhost:3000');
  
  ws.onopen = () => console.log("Connected to GVB feed");
  ws.onerror = (error) => console.error("WebSocket error:", error);
  
  return ws;
}

export async function renderToDOM(container, options = {
  tracking: false,
  showPaths: false,
  showTransit: false,
  showTraffic: false
}) {
  const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY });
  const googlemaps = await loader.importLibrary('maps');


  const darkMapType = new googlemaps.StyledMapType([], {
    name: "Dark"
  });

  const map = new googlemaps.Map(container, {
    center: AMSTERDAM_CENTER,
    zoom: 13,
    tilt: 45,
    heading: 0,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: googlemaps.MapTypeControlStyle.DEFAULT,
      mapTypeIds: ['roadmap','terrain','satellite','hybrid','dark_3d','terrain']
    },
    streetViewControl: false,
    mapId: MY_DARK_3D_MAP_ID
  });

  map.mapTypes.set('dark_3d', darkMapType);
  map.addListener('maptypeid_changed', () => {
    const type = map.getMapTypeId();
    console.log('maptypeid changed:', type);
    if (type === 'satellite') {
      // Old-school Satellite with 45° if available
      map.setOptions({
        mapId: null,
        tilt: 45,
        heading: 0
      });
      console.log('Switched to Satellite mode (classic, 45° imagery).');
    } else if (type === 'dark_3d') {
      // Force usage of your vector mapId it doesnt seem to work otherwise.
      map.setOptions({
        mapId: MY_DARK_3D_MAP_ID,
        tilt: 45,
        heading: 0
      });
      console.log('Switched to Dark 3D vector environment.');
    } else {
      // Roadmap or anything else => normal 3d
      map.setOptions({
        mapId: GOOGLE_MAP_ID,
        tilt: 45,
        heading: 0
      });
      console.log('Switched to normal Roadmap (3D).');
    }
  });

  


  // Load and verify GeoJSON
  const resp = await fetch(ROADS_URL);
  const geoJson = await resp.json();
  
  // Convert GeoJSON to animation format with validation
  let data = geoJson.features
    .filter(f => 
      f.properties.highway === 'motorway' ||
      f.properties.highway === 'motorway_link'||
      f.properties.highway === 'primary' ||
      f.properties.highway === 'secondary' ||
      // f.properties.highway === 'tertiary' ||
      f.properties.highway === 'trunk' ||
      // f.properties.highway === 'unclassified' 
      f.properties.highway === 'busway' 
      // f.properties.highway === 'residential' 
      // f.properties.highway === 'cycleway'

    )
    .map(f => f.geometry.coordinates[0])
    .filter(coords => 
      Array.isArray(coords) && 
      coords.length >= 2
    );

    function isLoop(coords, thresholdMeters = 15) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    const dist = approximateLatLngDistMeters(first, last);
    return dist < thresholdMeters;
  }
  data = data.filter(coords => !isLoop(coords));
  
  data.sort((a, b) => approximateLineLength(b) - approximateLineLength(a));  
  const slicedData = data.slice(1, 4);
  console.log('Using the top 3 longest motorway segments:', slicedData.length);

  console.log('Prepared animation data:', {
    count: data.length,
    using: slicedData.length,
    sample: data[0]
  });

  let transitLayer = null;
  let trafficLayer = null;

  // Toggle transit
  if (options.showTransit) {
    transitLayer = new googlemaps.TransitLayer();
    transitLayer.setMap(map);
  }

  // Toggle traffic
  if (options.showTraffic) {
    trafficLayer = new googlemaps.TrafficLayer();
    trafficLayer.setMap(map);
  }

  const overlay = new DeckOverlay({layers: []});
  overlay.setMap(map);

  // Initialize vehicle positions storage
  const vehiclePositions = new Map();
  
  // Connect to GVB feed
  const socket = await createGVBSocket();

  socket.onmessage = (event) => {
    try {
      console.log('Raw message:', event.data);

      const parsed = JSON.parse(event.data);
      const lineStr = String(parsed.lineplanningnumber).toUpperCase();
      const info = LINE_INFO[lineStr];
     
      if (parsed && parsed.vehiclenumber && parsed.position) {
        const vehicleData = {
          vehicleId: parsed.vehiclenumber,
          position: parsed.position,
          type: info ? info.type : 'BUS',
          line: parsed.lineplanningnumber,
          direction: info ? info.direction : 'Unknown route'
        };

        if (isValidPosition(vehicleData.position)) {
          vehiclePositions.set(vehicleData.vehicleId, vehicleData);
          console.log('Updated vehicle:', vehicleData);
        }
      }
    } catch (err) {
      console.warn('Failed to parse message:', err);
    }
  };

  const stopAnimation = startAnimation(map, overlay, slicedData, options, vehiclePositions, socket);
  function approximateLatLngDistMeters(coordA, coordB) {
    const [lng1, lat1] = coordA;
    const [lng2, lat2] = coordB;
  
    // Quick Haversine approximation
    const R = 6371008.8; 
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function approximateLineLength(coords) {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      total += approximateLatLngDistMeters(coords[i - 1], coords[i]);
    }
    return total;
  }

  function toRad(angleDeg) {
    return (Math.PI * angleDeg) / 180;
  }


  return {
    update: newOpts => {
      Object.assign(options, newOpts);

      // Update transit layer
      if (transitLayer) transitLayer.setMap(null);
      if (options.showTransit) {
        transitLayer = new googlemaps.TransitLayer();
        transitLayer.setMap(map);
      }

      // Update traffic layer
      if (trafficLayer) trafficLayer.setMap(null);
      if (options.showTraffic) {
        trafficLayer = new googlemaps.TrafficLayer();
        trafficLayer.setMap(map);
      }

      overlay.setProps({layers: []}); // Update overlay ;)
    },
    remove: () => {
      stopAnimation();
      overlay.finalize();
    }
  
  };
}

function startAnimation(map, overlay, data, options, vehiclePositions, socket) {
  // Create trips with validation
  const trips = data
    .filter(path => Array.isArray(path) && path.length >= 2)
    .map(path => {
      try {
        return new TripBuilder({ waypoints: path, loop: true });
      } catch (err) {
        console.warn('Failed to create trip:', err);
        return null;
      }
    })
    .filter(Boolean);

  console.log('Created trips:', trips.length);

  let timestamp = 0;
  let animationId;

  const animate = () => {
    timestamp += 0.02;
    
    // Get frame with error handling
    const frame = trips.map(trip => {
      try {
        return trip.getFrame(timestamp);
      } catch (err) {
        console.warn('Frame error:', err);
        return null;
      }
    }).filter(Boolean);

    const transitVehicles = Array.from(vehiclePositions?.values() || []);
    console.log('Transit Vehicles:', transitVehicles);


    overlay.setProps({
      layers: [
        // Company vehicles path layer
        options.showPaths && new PathLayer({
          id: 'company-paths',
          data: trips,
          getPath: t => t.keyframes.map(k => k.point),
          getColor: [0, 128, 255],
          widthMinPixels: 2,
          opacity: 0.3
        }),
        
        // Company vehicles 3D models
        new ScenegraphLayer({
          id: 'company-vehicles',
          data: frame,
          scenegraph: MODEL_URL,
          sizeScale: 5,
          _lighting: 'pbr',
          getPosition: d => d.point,
          getTranslation: [0, 0, 1],
          getOrientation: d => [0, 180 - d.heading, 90],
          parameters: {
            depthTest: false
          }
        }),

        // Real-time transit points
        options.showTransit && new ScatterplotLayer({
          id: 'transit-vehicles',
          data: transitVehicles,
          getPosition: d => d.position,
          getFillColor: d => VEHICLE_COLORS[d.type] || VEHICLE_COLORS.DEFAULT,
          getRadius: 10,
          radiusUnits: 'pixels',
          pickable: true,
          autoHighlight: true,

          onHover: (info, event) => {
            const tooltip = document.getElementById('deck-tooltip');
            if (!info.object) {
              tooltip.style.display = 'none';
              return;
            }
            tooltip.style.display = 'block';
            tooltip.style.left = `${info.x + 5}px`; 
            tooltip.style.top = `${info.y + 5}px`;

            const {line, type, direction} = info.object;

            tooltip.innerHTML = `
            <div><strong>${type}</strong> Line: ${line}</div>
            <div>${direction}</div>
            `;

          },

          onClick: (info, event) => {
              if (info.object) {
                console.log('Clicked on:', info.object);
              }
          }

        })
      ].filter(Boolean)
    });

    if (options.tracking && frame.length) {
      map.moveCamera({
        center: {lat: frame[0].point[1], lng: frame[0].point[0]},
        heading: frame[0].heading
      });
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();
  return () => {
    cancelAnimationFrame(animationId);
    socket?.close();
  };
}

// Add helper functions for extraction
async function extractTrafficPaths(trafficLayer, map) {
  return new Promise(resolve => {
    trafficLayer.addListener('traffic_changed', () => {
      console.log('Traffic data loaded');
      const trafficFeatures = trafficLayer.getTrafficFeatures();
      console.log('Traffic features:', trafficFeatures?.length);
      
      const paths = trafficFeatures
        ?.map(feature => feature.getGeometry()?.getArray())
        ?.filter(coords => Array.isArray(coords) && coords.length >= 2)
        ?.map(coords => coords.map(point => [point.lng(), point.lat()]));
      
      console.log('Extracted traffic paths:', paths?.length);
      resolve(paths || []);
    });
    
    // Trigger traffic data load
    trafficLayer.setMap(map);
  });
}

async function extractTransitPaths(transitLayer, map) {
  return new Promise(resolve => {
    transitLayer.addListener('transit_changed', () => {
      console.log('Transit data loaded');
      const transitRoutes = transitLayer.getTransitFeatures();
      console.log('Transit routes:', transitRoutes?.length);
      
      const paths = transitRoutes
        ?.map(route => route.getGeometry()?.getArray())
        ?.filter(coords => Array.isArray(coords) && coords.length >= 2)
        ?.map(coords => coords.map(point => [point.lng(), point.lat()]));
      
      console.log('Extracted transit paths:', paths?.length);
      resolve(paths || []);
    });
    
    // Trigger transit data load
    transitLayer.setMap(map);
  });
}


function isValidPosition(pos) {
  return Array.isArray(pos) && 
         pos.length === 2 && 
         !isNaN(pos[0]) && 
         !isNaN(pos[1]);
}
