import React, { useState } from 'react';
import { FileText, Plus, FolderOpen, UploadCloud, Trash2 } from 'lucide-react';
import * as Y from 'yjs';

export default function FileTree({ workspaceFiles, activeFile, setActiveFile, peers = [], clientId }) {
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [files, setFiles] = useState([]);

  React.useEffect(() => {
    if (!workspaceFiles) return;
    
    // Initial load
    setFiles(Array.from(workspaceFiles.keys()));

    const observer = () => {
      setFiles(Array.from(workspaceFiles.keys()));
    };

    workspaceFiles.observe(observer);

    return () => {
      workspaceFiles.unobserve(observer);
    };
  }, [workspaceFiles]);
  const handleCreateFile = () => {
    if (!newFileName.trim() || !workspaceFiles) {
      setIsCreating(false);
      setNewFileName('');
      return;
    }
    
    let name = newFileName.trim();
    if (!name.includes('.')) name += '.md'; // default extension
    
    // Create new Y.Text inside the map if it doesn't exist
    if (!workspaceFiles.has(name)) {
      workspaceFiles.set(name, new Y.Text());
    }
    
    setActiveFile(name);
    setIsCreating(false);
    setNewFileName('');
  };

  const handleDeleteFile = (e, filename) => {
    e.stopPropagation();
    if (workspaceFiles) {
      workspaceFiles.delete(filename);
      if (activeFile === filename) {
        setActiveFile(null);
      }
    }
  };

  const handleClearWorkspace = () => {
    if (workspaceFiles) {
      const keys = Array.from(workspaceFiles.keys());
      keys.forEach(key => workspaceFiles.delete(key));
      setActiveFile(null);
    }
  };

  return (
    <div style={{
      width: '250px',
      borderRight: '1px solid var(--background-modifier-border, #444)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background-primary, #0d1117)'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--background-modifier-border, #444)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-normal, #e3e3e3)', fontWeight: 'bold' }}>
          <FolderOpen size={18} />
          Workspace
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {files.length > 0 && (
            <button 
              onClick={handleClearWorkspace}
              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              title="Clear Workspace"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted, #8b949e)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
            title="New File"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {isCreating && (
          <div style={{ padding: '4px 16px' }}>
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              onBlur={handleCreateFile}
              placeholder="filename.md"
              style={{
                width: '100%',
                background: 'var(--background-modifier-form-field, #161b22)',
                border: '1px solid var(--interactive-accent, #8e44ad)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                outline: 'none',
                fontSize: '13px'
              }}
            />
          </div>
        )}
        
        {files.length === 0 && !isCreating && (
          <div style={{ padding: '16px', color: 'var(--text-muted, #8b949e)', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <UploadCloud size={24} style={{ opacity: 0.5 }} />
            Drop a folder anywhere to import, or click + to create a file.
          </div>
        )}
        
        {files.map(filename => {
          const activePeers = peers.filter(p => p.state.activeFile === filename && p.id !== clientId);
          
          return (
          <div 
            key={filename}
            onClick={() => setActiveFile(filename)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: activeFile === filename ? '#fff' : 'var(--text-normal, #c9d1d9)',
              background: activeFile === filename ? 'rgba(142, 68, 173, 0.2)' : 'transparent',
              borderLeft: activeFile === filename ? '2px solid #8e44ad' : '2px solid transparent',
              transition: 'all 0.1s ease',
              wordBreak: 'break-all'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color={activeFile === filename ? '#8e44ad' : '#8b949e'} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{filename}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {activePeers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {activePeers.slice(0, 3).map(p => (
                    <div 
                      key={p.id} 
                      title={p.state.user?.name || 'Peer'}
                      style={{
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: p.state.user?.color || '#fff',
                        border: '1px solid var(--background-primary, #0d1117)'
                      }} 
                    />
                  ))}
                  {activePeers.length > 3 && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{activePeers.length - 3}</span>
                  )}
                </div>
              )}
            <button
              onClick={(e) => handleDeleteFile(e, filename)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #8b949e)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6
              }}
              title="Delete File"
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #8b949e)'; e.currentTarget.style.opacity = '0.6'; }}
            >
              <Trash2 size={14} />
            </button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
