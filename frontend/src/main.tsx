import React from 'react';
import ReactDOM from 'react-dom/client';
import AppLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppLayout>
      <HomePage />
    </AppLayout>
  </React.StrictMode>
);
