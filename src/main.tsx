import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ensureBootstrapAdmins } from './lib/adminAuth';
import { initGuestSessionOnLoad } from './lib/guestSession';

ensureBootstrapAdmins();
initGuestSessionOnLoad();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
