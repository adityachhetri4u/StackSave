import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store the current session for use in interceptor
let currentSession = null;

// Update session whenever Supabase auth changes
supabase.auth.onAuthStateChange((event, session) => {
  currentSession = session;
  console.log('[API] Auth state changed:', { event, hasToken: !!session?.access_token });
});

// Get initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  currentSession = session;
  console.log('[API] Initial session loaded:', { hasToken: !!session?.access_token });
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  console.log('[API] Request to:', config.url);
  
  // Use the stored session
  if (currentSession?.access_token) {
    console.log('[API] Attaching token:', currentSession.access_token.substring(0, 30) + '...');
    config.headers.Authorization = `Bearer ${currentSession.access_token}`;
  } else {
    console.warn('[API] No token available!', { 
      hasSession: !!currentSession,
      hasToken: !!currentSession?.access_token,
      sessionUser: currentSession?.user?.email || 'NO USER'
    });
  }
  return config;
});

// Transform error responses to standard format
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data?.error || error.response?.data?.detail?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: {},
    };
    return Promise.reject(errorData);
  }
);

export default api;
