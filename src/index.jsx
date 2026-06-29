import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

export { default as YjsEngine } from './YjsEngine.js';
export { default as WebsocketProvider } from './providers/WebsocketProvider.js';
export { default as WebRTCProvider } from './providers/WebRTCProvider.js';

// Renders the Interactive Network Dashboard when opened in the UI
export function mount_app(container, platformAPI) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <App platformAPI={platformAPI} />
    </React.StrictMode>
  );
  
  return () => {
    root.unmount();
  };
}
