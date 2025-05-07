// CustomEvent polyfill using built-in Event class
if (typeof globalThis.CustomEvent !== 'function') {
  class CustomEvent extends Event {
    constructor(event, params = {}) {
      super(event);
      this.detail = params.detail || null;
    }
  }
  globalThis.CustomEvent = CustomEvent;
}

import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { identify } from '@libp2p/identify'
import { kadDHT } from '@libp2p/kad-dht'

const relay = await createLibp2p({
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/15001/ws',
      '/ip4/0.0.0.0/tcp/15002'
    ]
  },
  transports: [
    webSockets(),
    circuitRelayTransport()
  ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  dht: kadDHT(),
  services: {
    identify: identify(),
    pubsub: gossipsub({
      emitSelf: false,
      globalSignaturePolicy: 'StrictNoSign',
      doPX: true,
      scoreThresholds: {
        gossipThreshold: -10,
        publishThreshold: -20,
        graylistThreshold: -30
      },
      scoreParams: {
        appSpecificWeight: 0.5,
        IPColocationFactorWeight: -1,
        behaviourPenaltyWeight: -1
      }
    }),
    relay: circuitRelayServer({
      advertise: true,
      hop: {
        enabled: true,
        active: true,
        timeout: 30000
      }
    })
  }
})

// Debugging
relay.addEventListener('peer:connect', (evt) => {
  console.log(`✅ Peer connected: ${evt.detail.toString()}`)
})

relay.services.pubsub.addEventListener('message', (evt) => {
  console.log(`📨 Relay saw message on ${evt.detail.topic}`)
})

console.log(`🚀 Relay Node ID: ${relay.peerId.toString()}`)
console.log('📡 Listening on:', relay.getMultiaddrs().map(addr => addr.toString()))

// Keep alive
setInterval(() => {}, 60000)
