import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSupabase } from '@weekflow/shared/lib/supabase';
import App from './App';
import './index.css';

initSupabase(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
