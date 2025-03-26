import axios from 'axios';
import { store } from '../store/store';

// Create axios instance with base URL
export const api = axios.create({
    baseURL: 'http://localhost:3003',
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.user.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle specific error cases here if needed
        return Promise.reject(error);
    }
);

export default api; 