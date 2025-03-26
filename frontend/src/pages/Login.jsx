import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { setUser, setLoading, setError } from '../store/userSlice';
import { RiGoogleFill } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            dispatch(setLoading(true));

            // Sign in with Google
            const { user, firebaseToken } = await authService.signInWithGoogle();
            console.log("Firebase auth successful:", user);

            // Verify token with backend
            const response = await fetch(`${API_BASE_URL}/verify-token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: firebaseToken }),
            });

            const data = await response.json();
            console.log("Backend verification response:", data);

            if (data.success) {
                // Store user data and token in Redux
                const userData = {
                    user: {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName,
                        picture: user.photoURL
                    },
                    token: firebaseToken
                };

                console.log("Dispatching user data to Redux:", userData);
                dispatch(setUser(userData));

                toast.success('Login successful!');

                // Force a small delay to ensure Redux state is updated
                setTimeout(() => {
                    console.log("Navigating to home page");
                    navigate('/', { replace: true });
                }, 100);
            } else {
                dispatch(setError('Authentication failed'));
                toast.error('Authentication failed');
            }
        } catch (error) {
            console.error('Login Error:', error);
            dispatch(setError(error.message || 'Login failed'));
            toast.error('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Welcome to LetterFlow
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to start creating and collaborating on documents
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <RiGoogleFill className="w-6 h-6" />
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;