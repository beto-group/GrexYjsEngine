import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';

export default class WebsocketProvider {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.options = options;
    this.provider = null;
  }

  connect(doc, roomName) {
    if (this.provider) {
      this.disconnect();
    }
    
    // Inject auth token if provided in options (e.g., from .grex-engine)
    const urlParams = this.options.token ? `?auth=${this.options.token}` : '';
    
    this.provider = new YWebsocketProvider(
      `${this.serverUrl}`,
      roomName + urlParams,
      doc,
      { connect: true }
    );

    this.provider.on('status', event => {
      console.log(`[WebsocketProvider] Status changed to: ${event.status} (Room: ${roomName})`);
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
