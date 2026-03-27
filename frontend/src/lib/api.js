import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
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
