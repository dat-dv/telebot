import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { captureDashboardToken } from './auth-storage';
import { QueryProvider } from './query-provider';
import './styles.css';

captureDashboardToken();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
);
