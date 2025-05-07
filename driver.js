// CustomEvent polyfill for environments without native support
if (typeof globalThis.CustomEvent !== "function") {
    class CustomEvent extends Event {
      constructor(event, params = {}) {
        super(event);
        this.detail = params.detail || null;
      }
    }
    globalThis.CustomEvent = CustomEvent;
  }
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { identify } from '@libp2p/identify';
import { multiaddr } from '@multiformats/multiaddr';

async function createDriverNode() {
    const node = await createLibp2p({
        transports: [webSockets()], // ✅ TCP added for better connectivity
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()],
        services: {
            identify: identify(),
            pubsub: gossipsub()
        }
    });

    await node.start(); // ✅ Ensure node starts before handling requests

    console.log(`✅ Driver Node Initialized: ${node.peerId.toString()}`);
    console.log(`🌍 Listening on Multiaddrs:`);
    node.getMultiaddrs().forEach(addr => console.log(`📡 ${addr.toString()}`));

    const topic = 'ride-requests';
    node.services.pubsub.subscribe(topic, async (msg) => {
        const request = JSON.parse(new TextDecoder().decode(msg.detail.data));
        console.log(`🚕 New Ride Request Received! Rider: ${request.riderName}, Destination: ${request.destination}`);

        const response = {
            type: 'ride-accepted',
            driverName: 'Ahmed Raza', // ✅ Modify driver name if needed
            eta: '5 minutes',
            requestId: request.timestamp
        };

        await node.services.pubsub.publish(topic, new TextEncoder().encode(JSON.stringify(response)));
        console.log('✅ Ride acceptance response sent!');
    });

    return node;
}

// Start driver node
createDriverNode();