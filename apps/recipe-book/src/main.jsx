// 進入點：把 <Root/> 掛到 index.html 的 #root。
// 真正的邏輯都在 Root.jsx → App.jsx → components/。
import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root.jsx';
import './style.css';

createRoot(document.getElementById('root')).render(<Root />);
