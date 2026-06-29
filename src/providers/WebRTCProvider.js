import { WebrtcProvider as YWebRTCProvider } from 'y-webrtc';

export default class WebRTCProvider {
  constructor(signalingServers = []) {
    // Optional: Pass custom STUN/TURN signaling servers if default isn't sufficient
    this.signalingServers = signalingServers;
    this.provider = null;
  }

  connect(doc, roomName) {
    if (this.provider) {
      this.disconnect();
    }
    
    // y-webrtc establishes a P2P mesh network using WebRTC 
    // It relies on signaling servers just to discover peers initially.
    const options = this.signalingServers.length > 0 
      ? { signaling: this.signalingServers } 
      : {};

    this.provider = new YWebRTCProvider(
      roomName,
      doc,
      options
    );

    this.provider.on('synced', synced => {
      console.log(`[WebRTCProvider] P2P Sync complete: ${synced} (Room: ${roomName})`);
    });
    
    this.provider.on('peers', event => {
       console.log(`[WebRTCProvider] Active peers connected: ${event.webrtcPeers.length}`);
    });
  }

  disconnect() {
    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
    }
  }
}
