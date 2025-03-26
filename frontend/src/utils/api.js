import axios from 'axios';
import { store } from '../store/store';
import { API_BASE_URL } from '../config/api';

// Create axios instance with base URL
export const api = axios.create({
    baseURL: API_BASE_URL,
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