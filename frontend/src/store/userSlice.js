import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentUser: null,
    token: null,
    isLoading: false,
    error: null
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.currentUser = action.payload.user;
            state.token = action.payload.token;
            state.isLoading = false;
            state.error = null;

            // Store token in localStorage for persistence
            localStorage.setItem('token', action.payload.token);
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.token = null;
            state.isLoading = false;
            state.error = null;

            // Remove token from localStorage
            localStorage.removeItem('token');
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        }
    }
});

export const { setUser, clearUser, setLoading, setError } = userSlice.actions;
export default userSlice.reducer; 