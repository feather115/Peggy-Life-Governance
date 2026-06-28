// Entry point: mounts <Root/> to #root in index.html.
// The real logic resides in Root.jsx -> App.jsx -> components/.
import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root.jsx';
import { initLiff } from './liff.js';

initLiff().finally(() => {
  createRoot(document.getElementById('root')).render(<Root />);
});
