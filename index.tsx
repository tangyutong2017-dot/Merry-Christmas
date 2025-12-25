import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThreeElements } from '@react-three/fiber';

// Augment the JSX namespace to include Three.js elements for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);