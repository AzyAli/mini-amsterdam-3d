// // import { GoogleMapsOverlay } from "@deck.gl/google-maps";
// // import { TripsLayer } from "deck.gl";


// const VEHICLE_MODELS = {
//   BUS: './models/bus/scene.gltf',
//   TRAM: './models/tram/scene.gltf',
//   FERRY: './models/ferry/scene.gltf',
// };

// const AMSTERDAM_BOUNDS = {
//   north: 52.4301759,
//   south: 52.3276,
//   east: 4.9789,
//   west: 4.7392515
// };

// async function fetchTransitRoutes(google) {
//   const service = new google.maps.DirectionsService();
  
//   const transitRequests = [
//     // Major transit hubs in Amsterdam
//     {origin: 'Amsterdam Centraal', destination: 'Amsterdam Zuid'},
//     {origin: 'Amsterdam Sloterdijk', destination: 'Amsterdam Bijlmer ArenA'},
//     {origin: 'Amsterdam RAI', destination: 'Amsterdam Science Park'}
//   ];

//   const routes = await Promise.all(
//     transitRequests.map(async ({origin, destination}) => {
//       const result = await service.route({
//         origin,
//         destination,
//         travelMode: google.maps.TravelMode.TRANSIT
//       });
//       return transformRoute(result);
//     })
//   );

//   return routes.flat();
// }

// function transformRoute(direction) {
//   return {
//     path: direction.routes[0].overview_path.map(p => [p.lng(), p.lat()]),
//     type: direction.routes[0].transit?.line?.vehicle?.type || 'BUS'
//   };
// }

// export {fetchTransitRoutes, VEHICLE_MODELS};