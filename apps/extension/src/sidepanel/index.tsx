import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup as SidePanelApp } from '../popup/Popup';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SidePanelApp />
    </React.StrictMode>
  );
}
