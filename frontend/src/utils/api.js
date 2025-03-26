import axios from 'axios';
import { store } from '../store/store';
import { clearUser } from '../store/userSlice';

const api = axios.create({
    baseURL: 'http://localhost:3003',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = store.getState().user.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            store.dispatch(clearUser());
        }
        return Promise.reject(error);
    }
);

export { api }; 