import React, { useState } from 'react';
import { X, Network, Server, User as UserIcon, Settings } from 'lucide-react';

export default function ConnectionSettingsModal({ 
  currentWsUrl, 
  currentRoomName, 
  currentUserName, 
  currentUserColor, 
  onSave, 
  onClose 
}) {
  const [wsUrl, setWsUrl] = useState(currentWsUrl);
  const [roomName, setRoomName] = useState(currentRoomName);
  const [userName, setUserName] = useState(currentUserName);
  const [userColor, setUserColor] = useState(currentUserColor);

  const handleSave = () => {
    onSave({ wsUrl, roomName, userName, userColor });
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'var(--font-interface, sans-serif)'
    }}>
      <div style={{
        background: 'var(--background-secondary, #1e1e1e)',
        border: '1px solid var(--background-modifier-border, #444)',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--background-modifier-border, #444)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--background-primary, #0d1117)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <Settings size={18} color="#8e44ad" />
            Connection Settings
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #8b949e)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted, #8b949e)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Server size={14} /> WebSocket URL
            </label>
            <input 
              type="text" 
              value={wsUrl} 
              onChange={e => setWsUrl(e.target.value)}
              style={{
                background: 'var(--background-modifier-form-field, #161b22)',
                border: '1px solid var(--background-modifier-border, #444)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted, #8b949e)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Network size={14} /> Room Name
            </label>
            <input 
              type="text" 
              value={roomName} 
              onChange={e => setRoomName(e.target.value)}
              style={{
                background: 'var(--background-modifier-form-field, #161b22)',
                border: '1px solid var(--background-modifier-border, #444)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted, #8b949e)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserIcon size={14} /> Identity Name
            </label>
            <input 
              type="text" 
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              style={{
                background: 'var(--background-modifier-form-field, #161b22)',
                border: '1px solid var(--background-modifier-border, #444)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted, #8b949e)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Avatar Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="color" 
                value={userColor} 
                onChange={e => setUserColor(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  borderRadius: '50%'
                }}
              />
              <span style={{ fontSize: '13px', color: '#fff' }}>{userColor}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--background-modifier-border, #444)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          background: 'var(--background-primary, #0d1117)'
        }}>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--background-modifier-border, #444)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              background: '#8e44ad',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Save & Reconnect
          </button>
        </div>
      </div>
    </div>
  );
}
