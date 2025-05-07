import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { multiaddr } from '@multiformats/multiaddr'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'

const topic = 'ride-requests-final-v1'
const relayId = '12D3KooWHptYSHPtSQW28wPH4Pa4tnDBnGksd1bRDoJ5BTUv6Vr6' // Replace with actual relay ID
const relayAddr = `/ip4/127.0.0.1/tcp/15001/ws/p2p/${relayId}`

const node = await createLibp2p({
  transports: [
    webSockets(),
    circuitRelayTransport()
  ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
    pubsub: gossipsub({
      allowPublishToZeroTopicPeers: true,
      fallbackToFloodsub: true,
      floodPublish: true,
      globalSignaturePolicy: 'StrictNoSign',
      doPX: true,
      msgIdFn: msg => msg.data,
      seenTTL: 300000
    })
  }
})

// Connection management
node.addEventListener('peer:connect', (evt) => {
  console.log(`✅ Connected to: ${evt.detail.toString()}`)
  document.getElementById('output').innerHTML += 
    `<div class="log success">✅ Connected to peer</div>`
})

// Connect to relay with retry
const connectWithRetry = async () => {
  let attempts = 0
  while (attempts < 3) {
    try {
      await node.dial(multiaddr(relayAddr))
      console.log('✅ Connected to relay node')
      document.getElementById('output').innerHTML += 
        `<div class="log success">✅ Connected to relay node</div>`
      return
    } catch (err) {
      attempts++
      console.log(`Attempt ${attempts} failed`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  throw new Error('Failed to connect to relay')
}

await connectWithRetry()

// Subscribe to topic
await node.services.pubsub.subscribe(topic)
console.log(`📡 Subscribed to topic: ${topic}`)
document.getElementById('output').innerHTML += 
  `<div class="log success">📡 Subscribed to topic: ${topic}</div>`

// Active peer discovery
const discoverPeers = async () => {
  const peers = await node.peerStore.all()
  for (const peer of peers) {
    if (peer.id.toString() !== node.peerId.toString()) {
      try {
        await node.dial(peer.id)
        console.log('Dialed peer:', peer.id.toString())
      } catch (err) {
        console.log('Failed to dial peer:', peer.id.toString())
      }
    }
  }
}

// Maintain connection
setInterval(discoverPeers, 5000)
discoverPeers()

// Send ride requests
document.getElementById('rideForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const rideData = {
    type: 'ride-request',
    id: Math.random().toString(36).substring(2, 9),
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    fare: document.getElementById('fare').value,
    vehicle: document.getElementById('vehicle').value,
    seats: document.getElementById('seats').value,
    timestamp: Date.now()
  }

  try {
    await node.services.pubsub.publish(
      topic,
      new TextEncoder().encode(JSON.stringify(rideData))
    )
    console.log('📤 Ride request sent!')
    document.getElementById('output').innerHTML += 
      `<div class="log success">📤 Ride request sent successfully!</div>`
  } catch (err) {
    console.error('Failed to send:', err)
    document.getElementById('output').innerHTML += 
      `<div class="log error">❌ Failed to send request</div>`
  }
})