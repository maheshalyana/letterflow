import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './userSlice';
import documentReducer from './documentSlice';

// Configure persistence for user reducer
const userPersistConfig = {
    key: 'user',
    storage,
    whitelist: ['currentUser', 'token'] // only persist these fields
};

// Configure persistence for documents reducer
const documentPersistConfig = {
    key: 'documents',
    storage,
    whitelist: ['items', 'currentDocument'] // only persist these fields
};

// Combine reducers
const rootReducer = combineReducers({
    user: persistReducer(userPersistConfig, userReducer),
    documents: persistReducer(documentPersistConfig, documentReducer)
});

// Create store
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

// Create persistor
export const persistor = persistStore(store); 