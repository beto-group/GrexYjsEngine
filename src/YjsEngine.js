import * as Y from 'yjs';

export default class YjsEngine {
  constructor(roomName = 'grex-default-room') {
    this.roomName = roomName;
    this.doc = new Y.Doc();
    this.providers = new Map(); // Store active network/storage providers
    this.activeProvider = null; // The primary connection currently dictating state

    console.log(`[YjsEngine] Initialized agnostic state for room: ${roomName}`);
  }

  /**
   * Register a connection provider (WebSocket, WebRTC, IndexedDB)
   * The provider must implement connect() and disconnect()
   */
  registerProvider(name, providerInstance) {
    this.providers.set(name, providerInstance);
    console.log(`[YjsEngine] Registered provider: ${name}`);
  }

  /**
   * Establish connection via a specific registered provider
   */
  connect(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} is not registered.`);
    }
    
    if (this.activeProvider) {
      this.disconnect();
    }

    const provider = this.providers.get(providerName);
    provider.connect(this.doc, this.roomName);
    this.activeProvider = provider;
    
    console.log(`[YjsEngine] Engine connected via: ${providerName}`);
  }

  /**
   * Gracefully close the active connection
   */
  disconnect() {
    if (this.activeProvider) {
      this.activeProvider.disconnect();
      this.activeProvider = null;
      console.log(`[YjsEngine] Engine disconnected.`);
    }
  }

  /**
   * Helper to get a shared Y.Map
   */
  getMap(name) {
    return this.doc.getMap(name);
  }

  /**
   * Helper to get a shared Y.Array
   */
  getArray(name) {
    return this.doc.getArray(name);
  }

  /**
   * Get the raw Yjs Document
   */
  getDocument() {
    return this.doc;
  }
}
