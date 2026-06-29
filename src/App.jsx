import React, { useEffect, useState, useRef } from 'react';
import { Network, Server, User, Radio, WifiOff, X, Play, Square, UploadCloud, Settings } from 'lucide-react';
import YjsEngine from './YjsEngine.js';
import WebsocketProvider from './providers/WebsocketProvider.js';
import FileTree from './FileTree.jsx';
import CollabEditor from './CollabEditor.jsx';
import ConnectionSettingsModal from './ConnectionSettingsModal.jsx';
import * as Y from 'yjs';

export default function App({ platformAPI }) {
  const [engine, setEngine] = useState(null);
  const [peers, setPeers] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const [clientId, setClientId] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [workspaceFiles, setWorkspaceFiles] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Connection Settings State
  const [wsUrl, setWsUrl] = useState('ws://localhost:3000');
  const [roomName, setRoomName] = useState('grex-system-room');
  const [userName, setUserName] = useState(`Host ${Math.floor(Math.random() * 1000)}`);
  const [userColor, setUserColor] = useState('#8e44ad');
  const [showSettings, setShowSettings] = useState(false);
  
  const engineRef = useRef(null);
  const wsProviderRef = useRef(null);
  const dragCounterRef = useRef(0);

  // We keep references to the handlers so we can detach them properly
  const handlersRef = useRef({
    updatePeers: null,
    status: null,
  });

  const attachListeners = (yjsEngine, wsProvider) => {
    // 1. Workspace Files
    const filesMap = yjsEngine.doc.getMap('workspace-files');
    setWorkspaceFiles(filesMap);

    // 2. Network Status
    if (wsProvider.provider) {
      if (handlersRef.current.status) {
        wsProvider.provider.off('status', handlersRef.current.status);
      }
      handlersRef.current.status = (event) => setStatus(event.status);
      wsProvider.provider.on('status', handlersRef.current.status);
      
      // 3. Awareness
      if (wsProvider.provider.awareness) {
        const awareness = wsProvider.provider.awareness;
        setClientId(awareness.clientID);
        
        awareness.setLocalStateField('user', {
          name: userName,
          type: 'dashboard',
          color: userColor
        });

        if (handlersRef.current.updatePeers) {
          awareness.off('change', handlersRef.current.updatePeers);
        }
        
        handlersRef.current.updatePeers = () => {
          const states = Array.from(awareness.getStates().entries());
          setPeers(states.map(([id, state]) => ({ id, state })));
        };

        awareness.on('change', handlersRef.current.updatePeers);
        handlersRef.current.updatePeers();
      }
    }
  };

  const detachListeners = () => {
    if (wsProviderRef.current && wsProviderRef.current.provider) {
      if (handlersRef.current.status) {
        wsProviderRef.current.provider.off('status', handlersRef.current.status);
        handlersRef.current.status = null;
      }
      if (wsProviderRef.current.provider.awareness && handlersRef.current.updatePeers) {
        wsProviderRef.current.provider.awareness.off('change', handlersRef.current.updatePeers);
        handlersRef.current.updatePeers = null;
      }
    }
  };

  const startConnection = (overrideRoom, overrideUrl) => {
    const targetRoom = overrideRoom || roomName;
    const targetUrl = overrideUrl || wsUrl;

    if (engineRef.current) {
      stopConnection();
    }
    
    const yjsEngine = new YjsEngine(targetRoom);
    engineRef.current = yjsEngine;
    
    let token = '';
    try { token = 'ephemeral-token'; } catch(e) {}

    const wsProvider = new WebsocketProvider(targetUrl, { token });
    wsProviderRef.current = wsProvider;
    yjsEngine.registerProvider('websocket', wsProvider);
    
    setEngine(yjsEngine);
    setStatus('connecting');
    engineRef.current.connect('websocket');
    attachListeners(engineRef.current, wsProviderRef.current);
  };

  const stopConnection = () => {
    if (!engineRef.current) return;
    detachListeners();
    engineRef.current.disconnect();
    setStatus('disconnected');
    setPeers([]);
    setWorkspaceFiles(null);
  };

  useEffect(() => {
    // Initial auto-connect
    startConnection();
    
    return () => {
      stopConnection();
      if (engineRef.current) {
        engineRef.current.doc.destroy();
        engineRef.current = null;
      }
      wsProviderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wsProviderRef.current && wsProviderRef.current.provider && wsProviderRef.current.provider.awareness) {
      wsProviderRef.current.provider.awareness.setLocalStateField('activeFile', activeFile);
    }
  }, [activeFile]);

  const handleKickClient = (clientIdToKick) => {
    if (wsProviderRef.current && wsProviderRef.current.provider && wsProviderRef.current.provider.awareness) {
      wsProviderRef.current.provider.awareness.removeAwarenessStates([clientIdToKick]);
    }
  };

  // --- DRAG AND DROP LOGIC (GLOBAL) ---
  const isValidTextFile = (name, type) => {
    if (type && type.startsWith('text/')) return true;
    const validExtensions = ['.md', '.txt', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.csv'];
    return validExtensions.some(ext => name.toLowerCase().endsWith(ext));
  };

  const processFileEntry = (fileEntry, path = '') => {
    fileEntry.file(file => {
      if (!isValidTextFile(file.name, file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const fullPath = path ? `${path}/${file.name}` : file.name;
        if (workspaceFiles && !workspaceFiles.has(fullPath)) {
          const yText = new Y.Text();
          yText.insert(0, content);
          workspaceFiles.set(fullPath, yText);
        }
      };
      reader.readAsText(file);
    });
  };

  const traverseDirectoryTree = (entry, path = '') => {
    if (entry.isFile) {
      processFileEntry(entry, path);
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      dirReader.readEntries(entries => {
        entries.forEach(childEntry => {
          traverseDirectoryTree(childEntry, path ? `${path}/${entry.name}` : entry.name);
        });
      });
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    if (!workspaceFiles) return;

    const items = e.dataTransfer.items;
    let handledAsObsidian = false;
    
    // Diagnostic log for Obsidian integration
    try {
        const textPayload = e.dataTransfer.getData('text/plain');
        console.log('[GrexYjsEngine] text/plain payload:', textPayload);
        
        if (textPayload && platformAPI && platformAPI.fs && platformAPI.fs.readDirRecursive) {
            console.log('[GrexYjsEngine] Passing text payload to Native Host for resolution...');
            const files = await platformAPI.fs.readDirRecursive(textPayload);
            if (files && files.length > 0) {
                files.forEach(f => {
                    workspaceFiles.set(f.path, new Y.Text(f.content));
                });
                handledAsObsidian = true;
                console.log(`[GrexYjsEngine] Successfully injected ${files.length} files from Native Host.`);
            }
        }
    } catch(err) {
        console.warn("[GrexYjsEngine] Obsidian Native Bridge failure:", err);
    }

    if (handledAsObsidian || !items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) traverseDirectoryTree(entry);
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        color: 'var(--text-normal, #e3e3e3)',
        fontFamily: 'var(--font-interface, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* GLOBAL DRAG OVERLAY */}
      {isDraggingOver && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(142, 68, 173, 0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px dashed #8e44ad',
          color: '#fff',
          fontWeight: 'bold',
          gap: '16px',
          pointerEvents: 'none'
        }}>
          <UploadCloud size={64} color="#8e44ad" />
          <span style={{ fontSize: '24px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Drop Folder to Import Workspace</span>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--background-modifier-border, #444)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Network size={28} color="#8e44ad" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Sovereign Workspace</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={startConnection}
              disabled={status === 'connected' || status === 'connecting'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: status === 'connected' || status === 'connecting' ? '#333' : '#2ecc71',
                color: status === 'connected' || status === 'connecting' ? '#888' : '#fff',
                border: 'none', borderRadius: '4px', padding: '0.5rem 1rem',
                cursor: status === 'connected' || status === 'connecting' ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              <Play size={16} /> Connect
            </button>
            <button
              onClick={stopConnection}
              disabled={status === 'disconnected'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: status === 'disconnected' ? '#333' : '#e74c3c',
                color: status === 'disconnected' ? '#888' : '#fff',
                border: 'none', borderRadius: '4px', padding: '0.5rem 1rem',
                cursor: status === 'disconnected' ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              <Square size={16} /> Stop
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#161b22',
                color: '#fff',
                border: '1px solid var(--background-modifier-border, #444)',
                borderRadius: '4px', padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Settings size={16} /> Settings
            </button>
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
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* FILE TREE SIDEBAR */}
        <FileTree 
          workspaceFiles={workspaceFiles} 
          activeFile={activeFile} 
          setActiveFile={setActiveFile} 
          peers={peers}
          clientId={clientId}
        />

        {/* EDITOR AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--background-primary-alt, #111)' }}>
          {/* Editor Header Tab */}
          <div style={{ 
            background: 'var(--background-secondary, #1e1e1e)', 
            borderBottom: '1px solid var(--background-modifier-border, #444)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            minHeight: '40px'
          }}>
            {activeFile ? (
              <div style={{ background: 'var(--background-primary, #0d1117)', padding: '4px 12px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '13px', color: '#fff' }}>
                {activeFile}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #8b949e)' }}>No active file</span>
            )}
          </div>
          
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <CollabEditor 
              yText={activeFile && workspaceFiles ? workspaceFiles.get(activeFile) : null}
              awareness={wsProviderRef.current?.provider?.awareness}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: NODE TREE (Moved to right sidebar for better editor focus) */}
        <div style={{ 
          width: '300px', 
          borderLeft: '1px solid var(--background-modifier-border, #444)',
          background: 'var(--background-secondary, #1e1e1e)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <h2 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Connected Nodes</h2>
          
          <div style={{
            background: 'var(--background-primary, #0d1117)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid var(--background-modifier-border, #444)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '6px' }}>
                <Server size={18} color="#3498db" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Orchestrator</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #999)' }}>(ws://localhost:3000)</span>
              </div>
            </div>
          </div>

          {peers.map((peer) => {
            const isLocal = peer.id === clientId;
            const user = peer.state.user || {};
            
            return (
              <div key={peer.id} style={{
                background: 'var(--background-primary, #0d1117)',
                borderRadius: '8px',
                padding: '1rem',
                border: isLocal ? '2px solid #8e44ad' : '1px solid var(--background-modifier-border, #444)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isLocal && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#8e44ad', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', padding: '0.1rem 0.4rem', borderBottomLeftRadius: '8px' }}>
                    YOU
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.4rem', background: user.color ? `${user.color}22` : 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                      <User size={18} color={user.color || '#fff'} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.9rem' }}>{user.name || 'Anonymous Peer'}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #999)' }}>
                        ID: {peer.id}
                      </span>
                    </div>
                  </div>
                  
                  {!isLocal && (
                    <button 
                      onClick={() => handleKickClient(peer.id)}
                      title="Force Remove Client"
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(231, 76, 60, 0.4)',
                        color: '#e74c3c',
                        borderRadius: '4px',
                        padding: '0.2rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {peers.length === 0 && status === 'connected' && (
            <div style={{ color: 'var(--text-muted, #888)', fontStyle: 'italic', fontSize: '13px' }}>
              No peers detected...
            </div>
          )}
        </div>
      </div>
      
      {showSettings && (
        <ConnectionSettingsModal 
          currentWsUrl={wsUrl}
          currentRoomName={roomName}
          currentUserName={userName}
          currentUserColor={userColor}
          onClose={() => setShowSettings(false)}
          onSave={(newSettings) => {
            setWsUrl(newSettings.wsUrl);
            setRoomName(newSettings.roomName);
            setUserName(newSettings.userName);
            setUserColor(newSettings.userColor);
            setShowSettings(false);
            
            // Reconnect with the newly saved parameters immediately
            startConnection(newSettings.roomName, newSettings.wsUrl);
          }}
        />
      )}
    </div>
  );
}
