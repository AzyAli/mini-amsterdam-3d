const WebSocket = require('ws');
const zmq = require('zeromq');
const { XMLParser } = require('fast-xml-parser');
const iconv = require('iconv-lite'); // Ensure iconv-lite is installed
const zlib = require('zlib'); // Built-in module for compression

const PORT = process.env.PORT || 3000;
let wss;

// Function to convert rdToWgs coordinates
function rdToWgs(x, y) {
    const x0 = 155000, y0 = 463000;
    const lat0 = 52.15517440, lon0 = 5.38720621;
// Constants for the conversion,truncated for brevity
    const Kp = [
        [0,1,3235.65389],[2,0,-32.58297],[0,2,-0.24750], /* ... */
    ];
    const Lp= [
        [1,0,5260.52916],[1,1,105.94684],[1,2,2.45656], /* ... */
    ];
    const dx = (x - x0) * 1e-5;
    const dy = (y - y0) * 1e-5;
    let lat = lat0, lon = lon0;

    // Apply sums
    for (const [p, q, k] of Kp) {
        lat += k * Math.pow(dx, p) * Math.pow(dy, q) / 3600;
    }
    for (const [p, q, l] of Lp) {
        lon += l * Math.pow(dx, p) * Math.pow(dy, q) / 3600;
    }
    return {lat, lng: lon};
}

// Function to decompress data if compressed
function decompressData(buffer) {
  return new Promise((resolve, reject) => {
    // Attempt gzip decompression
    zlib.gunzip(buffer, (err, decoded) => {
      if (!err) {
        return resolve(decoded);
      }
      // If gzip fails, attempt deflate decompression
      zlib.inflate(buffer, (inflateErr, decodedDeflate) => {
        if (!inflateErr) {
          return resolve(decodedDeflate);
        }
        // If both fail, reject
        reject(new Error('Data is not compressed with gzip or deflate'));
      });
    });
  });
}

async function parseVehicleData(msg) {
  // Log raw message length and first few bytes in hex
  console.log('Message Length:', msg.length);
  console.log('First 10 bytes (hex):', msg.slice(0, 10).toString('hex'));

  let dataStr = '';
  let decompressed = false;

  try {
    // Attempt to decompress the message
    const decompressedBuffer = await decompressData(msg);
    dataStr = decompressedBuffer.toString('utf8');
    decompressed = true;
    console.log('Data decompressed successfully.');
  } catch (decompressErr) {
    console.warn('Data is not compressed or failed to decompress:', decompressErr.message);
    // Fallback to UTF-8 decoding without decompression
    dataStr = msg.toString('utf8');
  }

  console.log('Decoded Data:', dataStr.slice(0, 200)); // Log first 200 chars for clarity

  // Check for XML tag after decompression or decoding
  if (!dataStr.includes('<KV6posinfo')) {
    console.warn('KV6posinfo tag not found in decoded data.');
    return {};
  }


  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreDeclaration: true,
      processEntities: false
    });
    const result = parser.parse(dataStr);

    if (!result?.VV_TM_PUSH?.KV6posinfo) {
        console.warn('No KV6posinfo array in parsed XML');
        return [];
    }

    const kv6Array = result.VV_TM_PUSH.KV6posinfo;
    const vehicles = [];


    for (const item of kv6Array) {
        const eventKey = Object.keys(item)[0];
        const eventData = item[eventKey];

        if (!eventData?.vehiclenumber) {
            continue;
        }

        // parse RD coords
        const rdX = parseFloat(eventData['rd-x']);
        const rdY = parseFloat(eventData['rd-y']);

        const {lat, lng} = rdToWgs(rdX, rdY);

        vehicles.push({
            eventType: eventKey,
            dataownercode: eventData.dataownercode,
            lineplanningnumber: eventData.lineplanningnumber,
            vehiclenumber: parseInt(eventData.vehiclenumber),
            rd_x: rdX,
            rd_y: rdY,
            //  convert Rd to lat/lng 
            position: [lng, lat]
        });
    }
    
    console.log('Parsed vehicles:', vehicles);
    return vehicles;
  } catch (e) {
    console.error('XML Parsing error:', e);
    return [];
  }
}



function broadcastToClients(payload) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

async function startServer() {
  try {
    wss = new WebSocket.Server({ port: PORT });
    console.log(`WebSocket server started on port ${PORT}`);

    const socket = new zmq.Subscriber();
    await socket.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
    await socket.subscribe("/GVB/KV6posinfo");
    console.log('Connected to NDOV feed for GVB data');

    for await (const [rawTopic, msg] of socket) {
      const topic = rawTopic.toString();
      if (topic === "/GVB/KV6posinfo") {
        try {
          console.log(`Received GVB message (${msg.length} bytes)`);

            const vehicleData = await parseVehicleData(msg);
            if (!vehicleData.length) {
                console.warn('No valid vehicle entries found in this KV6posinfo message');
                continue;
            }

            for (const v of vehicleData) {
                console.log('Broadcasting vehicle data:', v);
                broadcastToClients(v);
            }
        } catch (err) {
            console.error('Error processing GVB message:', err);
        }
      }
    }

    
    wss.on('connection', ws => {
      console.log('Client connected');
      ws.on('close', () => console.log('Client disconnected'));
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server error:', err);
    }
  }
}

startServer().catch(console.error);
