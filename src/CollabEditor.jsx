import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';

export default function CollabEditor({ yText, awareness }) {
  const [extensions, setExtensions] = useState([]);
  
  useEffect(() => {
    if (!yText || !awareness) return;
    
    // Bind Yjs to CodeMirror 6 with awareness (multi-cursors)
    const collabExtension = yCollab(yText, awareness, {
      undoManager: new Y.UndoManager(yText)
    });
    
    // Minimal sleek dark theme
    const darkTheme = EditorView.theme({
      "&": {
        backgroundColor: "transparent",
        color: "var(--text-normal, #e3e3e3)",
        height: "100%",
        fontSize: "14px",
        fontFamily: "var(--font-monospace, monospace)"
      },
      ".cm-content": {
        caretColor: "var(--text-accent, #8e44ad)",
        padding: "16px"
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--text-accent, #8e44ad)"
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "rgba(142, 68, 173, 0.3)"
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
        color: "var(--text-muted, #666)",
        borderRight: "1px solid var(--background-modifier-border, #444)"
      },
      // Yjs Awareness Cursor Styles
      ".cm-ySelectionInfo": {
        padding: "2px 6px",
        position: "absolute",
        top: "-1.5em",
        left: "-1px",
        fontSize: "10px",
        fontFamily: "sans-serif",
        fontStyle: "normal",
        fontWeight: "bold",
        lineHeight: "normal",
        userSelect: "none",
        color: "white",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        zIndex: 10
      },
      ".cm-ySelection": {
        display: "inline-block"
      }
    });

    setExtensions([
      collabExtension,
      darkTheme,
      EditorView.lineWrapping
    ]);
  }, [yText, awareness]);

  if (!yText) {
    return (
      <div style={{ padding: '20px', color: 'var(--text-muted, #888)', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        Select a file from the explorer to start collaborating.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <CodeMirror
        theme="dark"
        extensions={extensions}
        style={{ flex: 1, height: '100%', overflow: 'auto', outline: 'none' }}
      />
    </div>
  );
}
