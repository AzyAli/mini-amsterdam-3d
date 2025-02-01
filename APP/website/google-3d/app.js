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

const GOOGLE_MAPS_API_KEY = 'AIzaSyB3SJS6x2XGb7RuX6C3feKH_zuT34yTfi4';
const GOOGLE_MAP_ID = 'c08b06cb02f088ee';
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

// Add after existing constants
const MAP_STYLES = {
  default: [],
  silver: [
    {
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }]
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }]
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#616161" }]
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#f5f5f5" }]
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{ color: "#bdbdbd" }]
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#eeeeee" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#e5e5e5" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "road.arterial",
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#dadada" }]
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#616161" }]
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }]
    },
    {
      featureType: "transit.line",
      elementType: "geometry",
      stylers: [{ color: "#e5e5e5" }]
    },
    {
      featureType: "transit.station",
      elementType: "geometry",
      stylers: [{ color: "#eeeeee" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c9c9c9" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }]
    }
  ],
  night: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }]
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }]
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }]
    }
  ],
  retro: [
    { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#c9b2a6" }]
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "geometry.stroke",
      stylers: [{ color: "#dcd2be" }]
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{ color: "#ae9e90" }]
    },
    {
      featureType: "landscape.natural",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#93817c" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry.fill",
      stylers: [{ color: "#a5b076" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#447530" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#f5f1e6" }]
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#fdfcf8" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#f8c967" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#e9bc62" }]
    },
    {
      featureType: "road.highway.controlled_access",
      elementType: "geometry",
      stylers: [{ color: "#e98d58" }]
    },
    {
      featureType: "road.highway.controlled_access",
      elementType: "geometry.stroke",
      stylers: [{ color: "#db8555" }]
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [{ color: "#806b63" }]
    },
    {
      featureType: "transit.line",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "transit.line",
      elementType: "labels.text.fill",
      stylers: [{ color: "#8f7d77" }]
    },
    {
      featureType: "transit.line",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#ebe3cd" }]
    },
    {
      featureType: "transit.station",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [{ color: "#b9d3c2" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#92998d" }]
    }
  ],
  hiding: [
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }]
    }
  ]
};

// Replace ZMQ connection with WebSocket
async function createGVBSocket() {
  const ws = new WebSocket('ws://localhost:3000');
  
  ws.onopen = () => console.log("Connected to GVB feed");
  ws.onerror = (error) => console.error("WebSocket error:", error);
  
  return ws;
}

export async function renderToDOM(container, options = {
  tracking: true,
  showPaths: true,
  showTransit: true,
  showTraffic: true
}) {
  const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY });
  const googlemaps = await loader.importLibrary('maps');

  const map = new googlemaps.Map(container, {
    center: AMSTERDAM_CENTER,
    zoom: 13,
    heading: 0,
    tilt: 45,
    isFractionalZoomEnabled: true,
    streetViewControl: false,
    styles: MAP_STYLES.default
  });

  // Track 3D state
  map.myIs3D = false;

  // Style selector handler
  const styleSelector = document.getElementById('style-selector');
  if (styleSelector) {
    styleSelector.addEventListener('change', (event) => {
      if (!map.myIs3D) {
        const selectedStyle = event.target.value;
        map.setOptions({
          styles: MAP_STYLES[selectedStyle]
        });
      }
    });
  }

  // 3D toggle handler
  const toggle3dButton = document.getElementById('toggle-3d');
  if (toggle3dButton) {
    toggle3dButton.addEventListener('click', () => {
      if (map.myIs3D) {
        // Switch to 2D mode
        const currentStyle = styleSelector.value;
        map.setOptions({
          mapId: null,
          styles: MAP_STYLES[currentStyle],
          rotateControl: false
        });
        styleSelector.disabled = false;
        map.myIs3D = false;
      } else {
        // Switch to 3D mode with vector map
        map.setOptions({
          mapId: GOOGLE_MAP_ID,
          styles: [],
          tilt: 45,
          rotateControl: true
        });
        styleSelector.disabled = true;
        map.myIs3D = true;
      }
    });
  }

  // Load and verify GeoJSON
  const resp = await fetch(ROADS_URL);
  const geoJson = await resp.json();
  
  // Convert GeoJSON to animation format with validation
  const data = geoJson.features
    .filter(f => 
      f.properties.highway === 'motorway' ||
      f.properties.highway === 'motorway_link'
    )
    .map(f => f.geometry.coordinates[0])
    .filter(coords => 
      Array.isArray(coords) && 
      coords.length >= 2
    );

  console.log('Prepared animation data:', {
    count: data.length,
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

  const stopAnimation = startAnimation(map, overlay, data, options, vehiclePositions, socket);

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
