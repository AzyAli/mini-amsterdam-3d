const WebSocket = require('ws');
const zmq = require('zeromq');

const wss = new WebSocket.Server({ port: 8080 });
const zmqSocket = new zmq.Subscriber();

async function init() {
  await zmqSocket.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
  await zmqSocket.subscribe("/GVB/KV6posinfo");
  
  for await (const [topic, msg] of zmqSocket) {
    const data = msg.toString();
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

init().catch(console.error);