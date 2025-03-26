// API configuration
const isDevelopment = import.meta.env.DEV;

// In development, use localhost
// In production (Docker), the nginx proxy will handle routing
export const API_BASE_URL = isDevelopment
    ? 'http://localhost:3003'
    : 'http://13.235.75.86:3003';

export const WS_BASE_URL = isDevelopment
    ? 'ws://localhost:3003'
    : 'ws://13.235.75.86:3003'; 