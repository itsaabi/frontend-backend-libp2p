import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { identify } from '@libp2p/identify';
import { multiaddr } from '@multiformats/multiaddr';

async function createRiderNode() {
    const node = await createLibp2p({
        transports: [webSockets()],
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()],
        services: {
            identify: identify(),
            pubsub: gossipsub()
        }
    });

    console.log(`✅ Rider Node Initialized: ${node.peerId.toString()}`);

    const topic = 'ride-requests';
    node.services.pubsub.subscribe(topic, async (msg) => {
        const data = JSON.parse(new TextDecoder().decode(msg.detail.data));
        if (data.type === 'ride-accepted') {
            console.log(`✅ Ride Accepted! Driver: ${data.driverName}, ETA: ${data.eta}`);
        }
    });

    async function sendRideRequest(details) {
        const request = {
            type: 'ride-request',
            ...details,
            timestamp: Date.now()
        };

        await node.services.pubsub.publish(topic, new TextEncoder().encode(JSON.stringify(request)));
        console.log('📤 Ride request sent via Relay Node!');
    }

    return { node, sendRideRequest };
}

// Export module for frontend usage
export { createRiderNode };