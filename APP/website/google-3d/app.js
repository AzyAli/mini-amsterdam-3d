/* global fetch, requestAnimationFrame, cancelAnimationFrame */
import {GoogleMapsOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';
import {PathLayer} from '@deck.gl/layers';
import {Loader} from '@googlemaps/js-api-loader';

import TripBuilder from './trip-builder';

const GOOGLE_MAPS_API_KEY = 'Add your api Key here';
const GOOGLE_MAP_ID = 'add your mapid key here(not your api)';
const AMSTERDAM_CENTER = {lng: 4.9041, lat: 52.3676};

const DATA_URL = './data/amsterdam-trips.json';
const MODEL_URL = './models/truck/scene.gltf';

export async function renderToDOM(container, options = {
  tracking: true,
  showPaths: true,
  showTransit: true,
  showTraffic: true
}) {
  const loader = new Loader({apiKey: GOOGLE_MAPS_API_KEY});
  const googlemaps = await loader.importLibrary('maps');

  const resp = await fetch(DATA_URL);
  const data = await resp.json();

  const map = new googlemaps.Map(container, {
    center: AMSTERDAM_CENTER,
    zoom: 13,
    heading: 0,
    tilt: 45,
    isFractionalZoomEnabled: true,
    mapId: GOOGLE_MAP_ID,
    streetViewControl: false
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

  const stopAnimation = startAnimation(map, overlay, data, options);

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

      overlay.setProps({layers: []}); // Update overlay layers if needed
    },
    remove: () => {
      stopAnimation();
      overlay.finalize();
    }
  };
}

function startAnimation(map, overlay, data, options) {
  const trips = data.map(waypoints => new TripBuilder({waypoints, loop: true}));
  let timestamp = 0;
  let animation = null;

  const onAnimationFrame = () => {
    timestamp += 0.02;
    const frame = trips.map(trip => trip.getFrame(timestamp));

    overlay.setProps({
      layers: [
        options.showPaths &&
          new PathLayer({
            id: 'trip-paths',
            data: trips,
            getPath: t => t.keyframes.map(k => k.point),
            getColor: [0, 128, 255],
            widthMinPixels: 2,
            opacity: 0.3
          }),
        new ScenegraphLayer({
          id: 'vehicles',
          data: frame,
          scenegraph: MODEL_URL,
          sizeScale: 15,
          _lighting: 'pbr',
          getPosition: d => d.point,
          getTranslation: [0, 0, 1],
          getOrientation: d => [0, 180 - d.heading, 90],
          // pitch, yaw, roll
          parameters: {
            depthTest: false
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

    animation = requestAnimationFrame(onAnimationFrame);
  };

  onAnimationFrame();
  return () => cancelAnimationFrame(animation);
}
