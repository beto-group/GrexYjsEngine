import React, { useEffect, useState } from 'react';
import { Network, Server, User, Radio, WifiOff, X } from 'lucide-react';
import YjsEngine from './YjsEngine.js';
import WebsocketProvider from './providers/WebsocketProvider.js';

export default function App({ platformAPI }) {
  const [engine, setEngine] = useState(null);
  const [peers, setPeers] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const [clientId, setClientId] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    // 1. Initialize the Engine
    const yjsEngine = new YjsEngine('grex-system-room');
    
    // 2. We can try to dynamically retrieve the token from the platform bridge if available
    let token = '';
    try {
       token = 'ephemeral-token';
    } catch(e) {}

    // 3. Register the Orchestrator WebSocket Provider
    const wsProvider = new WebsocketProvider('ws://localhost:3000', { token });
    yjsEngine.registerProvider('websocket', wsProvider);
    
    // 4. Connect
    yjsEngine.connect('websocket');
    setEngine(yjsEngine);
    setStatus('connecting');

    // 5. Hook into Awareness
    if (wsProvider.provider && wsProvider.provider.awareness) {
      const awareness = wsProvider.provider.awareness;
      
      setClientId(awareness.clientID);
      
      awareness.setLocalStateField('user', {
        name: `Obsidian Host ${Math.floor(Math.random() * 1000)}`,
        type: 'dashboard',
        color: '#8e44ad'
      });

      const updatePeers = () => {
        const states = Array.from(awareness.getStates().entries());
        setPeers(states.map(([id, state]) => ({
          id,
          state
        })));
      };

      awareness.on('change', updatePeers);
      updatePeers();
    }
    
    // Listen to WS connection status
    if (wsProvider.provider) {
      wsProvider.provider.on('status', (event) => {
        setStatus(event.status); 
      });
    }

    // 6. Connect Shared Note Map
    const sharedMap = yjsEngine.doc.getMap('shared-data');
    const updateNote = () => {
      const text = sharedMap.get('note') || '';
      setNoteText(text);
    };
    sharedMap.observe(updateNote);
    updateNote();

    return () => {
      yjsEngine.disconnect();
    };
  }, []);

  const handleNoteChange = (e) => {
    const newText = e.target.value;
    setNoteText(newText); // Optimistic UI update
    
    if (engine) {
      const sharedMap = engine.doc.getMap('shared-data');
      sharedMap.set('note', newText);
    }
  };

  const handleKickClient = (clientIdToKick) => {
    if (engine && engine.providers['websocket']) {
      const wsProvider = engine.providers['websocket'];
      if (wsProvider.provider && wsProvider.provider.awareness) {
        wsProvider.provider.awareness.removeAwarenessStates([clientIdToKick]);
      }
    }
  };

  return (
    <div style={{
      padding: '2rem',
      color: 'var(--text-normal, #e3e3e3)',
      fontFamily: 'var(--font-interface, sans-serif)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--background-modifier-border, #444)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Network size={28} color="#8e44ad" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Network Inspector</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          background: status === 'connected' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
          color: status === 'connected' ? '#2ecc71' : '#e74c3c',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          {status === 'connected' ? <Radio size={16} /> : <WifiOff size={16} />}
          {status.toUpperCase()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexGrow: 1 }}>
        {/* LEFT COLUMN: NODE TREE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Connected Nodes</h2>
          
          <div style={{
            background: 'var(--background-secondary, #1e1e1e)',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '1px solid var(--background-modifier-border, #444)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '6px' }}>
                <Server size={24} color="#3498db" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Sovereign Orchestrator</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #999)' }}>API Gateway (ws://localhost:3000)</span>
              </div>
            </div>
          </div>

          {peers.map((peer) => {
            const isLocal = peer.id === clientId;
            const user = peer.state.user || {};
            
            return (
              <div key={peer.id} style={{
                background: 'var(--background-secondary, #1e1e1e)',
                borderRadius: '8px',
                padding: '1.5rem',
                border: isLocal ? '2px solid #8e44ad' : '1px solid var(--background-modifier-border, #444)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isLocal && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#8e44ad', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderBottomLeftRadius: '8px' }}>
                    YOU
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: user.color ? `${user.color}22` : 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                      <User size={24} color={user.color || '#fff'} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.name || 'Anonymous Peer'}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #999)' }}>
                        Client ID: {peer.id}
                      </span>
                    </div>
                  </div>
                  
                  {!isLocal && (
                    <button 
                      onClick={() => handleKickClient(peer.id)}
                      title="Force Remove Ghost Client"
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(231, 76, 60, 0.4)',
                        color: '#e74c3c',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)' }}>
                  <strong>Type:</strong> {user.type || 'unknown'}
                </div>
              </div>
            );
          })}
          
          {peers.length === 0 && status === 'connected' && (
            <div style={{ color: 'var(--text-muted, #888)', fontStyle: 'italic', padding: '1rem' }}>
              No peers detected in the awareness protocol...
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: COLLAB NOTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Collaborative Notepad</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.5rem 0' }}>
            Powered by Yjs Map (`shared-data.note`). Any edits made here are mathematically merged across the entire Sovereign mesh network in real-time.
          </p>
          <textarea
            value={noteText}
            onChange={handleNoteChange}
            placeholder="Start typing to broadcast globally..."
            style={{
              flexGrow: 1,
              width: '100%',
              minHeight: '400px',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--background-modifier-border, #444)',
              background: 'var(--background-primary, #111)',
              color: 'var(--text-normal, #e3e3e3)',
              fontFamily: 'var(--font-monospace, monospace)',
              fontSize: '14px',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>

    </div>
  );
}
