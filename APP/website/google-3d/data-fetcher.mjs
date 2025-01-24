import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchAmsterdamRoutes() {
  const query = `
    [out:json];
    area["name"="Amsterdam"]["admin_level"="8"]->.amsterdam;
    (
      way["highway"="primary"](area.amsterdam);
      way["highway"="secondary"](area.amsterdam);
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: query
  });

  const data = await response.json();
  return transformToTrips(data);
}

function transformToTrips(osmData) {
  const trips = [];
  osmData.elements
    .filter(e => e.type === 'way' && e.nodes.length > 5)  // Filter shorter segments
    .forEach(way => {
      const coordinates = way.nodes.map(nodeId => {
        const node = osmData.elements.find(e => e.type === 'node' && e.id === nodeId);
        return [node.lon, node.lat];
      });
      if (coordinates.length > 1) {
        trips.push(coordinates);
      }
    });
  return trips.slice(0, 20);  // Limit to 20 main routes
}

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Fetch and save data
fetchAmsterdamRoutes()
  .then(trips => {
    fs.writeFileSync(
      path.join(dataDir, 'amsterdam-trips.json'),
      JSON.stringify(trips, null, 2)
    );
    console.log('Successfully saved amsterdam-trips.json');
  })
  .catch(console.error);