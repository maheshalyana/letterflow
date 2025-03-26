// API configuration
const isDevelopment = import.meta.env.DEV;

// In development, use localhost
// In production, use the host's domain/IP
const DOMAIN = isDevelopment ? 'localhost' : window.location.hostname;

// Use secure protocols in production
const HTTP_PROTOCOL = isDevelopment ? 'http' : 'https';
const WS_PROTOCOL = isDevelopment ? 'ws' : 'wss';

// Use the same port as your backend service
const PORT = '3003';

export const API_BASE_URL = `${HTTP_PROTOCOL}://${DOMAIN}:${PORT}`;
export const WS_BASE_URL = `${WS_PROTOCOL}://${DOMAIN}:${PORT}`; 