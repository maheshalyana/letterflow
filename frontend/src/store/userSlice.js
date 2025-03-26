import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
    name: 'user',
    initialState: {
        currentUser: null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null
    },
    reducers: {
        setUser: (state, action) => {
            state.currentUser = action.payload.user;
            state.token = action.payload.token;
            state.loading = false;
            state.error = null;
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.token = null;
        },
        setLoading: (state) => {
            state.loading = true;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        registerUser: (state, action) => {
            state.currentUser = action.payload;
            state.token = action.payload.token;
            state.loading = false;
            state.error = null;
        },
        updateUser: (state, action) => {
            state.currentUser = action.payload;
            state.token = action.payload.token;
            state.loading = false;
            state.error = null;
        }
    }
});

export const { setUser, clearUser, setLoading, setError, registerUser, updateUser } = userSlice.actions;
export default userSlice.reducer; 