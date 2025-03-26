// API configuration
const isDevelopment = import.meta.env.DEV;

// In development, use localhost
// In production, use the host's domain/IP
const DOMAIN = isDevelopment ? 'localhost' : window.location.hostname;

// Use secure protocols in production, non-secure in development
const HTTP_PROTOCOL = isDevelopment ? 'http' : 'https';
const WS_PROTOCOL = isDevelopment ? 'ws' : 'wss';

// Use the same port as your backend service in development
// In production, use standard HTTPS port
const PORT = isDevelopment ? '3003' : '443';

export const API_BASE_URL = `${HTTP_PROTOCOL}://${DOMAIN}${isDevelopment ? `:${PORT}` : ''}/api`;
export const WS_BASE_URL = `${WS_PROTOCOL}://${DOMAIN}${isDevelopment ? `:${PORT}` : ''}`; 