// API configuration
const isDevelopment = import.meta.env.DEV;

// In development, use localhost
// In production, use the host's domain/IP
const DOMAIN = isDevelopment ? 'localhost' : window.location.hostname;

// Use non-secure protocols since we don't have SSL
const HTTP_PROTOCOL = 'http';
const WS_PROTOCOL = 'ws';

// Use the same port as your backend service
const PORT = '3003';

export const API_BASE_URL = `${HTTP_PROTOCOL}://${DOMAIN}:${PORT}`;
export const WS_BASE_URL = `${WS_PROTOCOL}://${DOMAIN}:${PORT}`; 