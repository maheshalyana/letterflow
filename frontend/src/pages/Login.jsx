import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { setUser } from '../store/userSlice';
import { RiGoogleFill } from 'react-icons/ri';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            const { user, firebaseToken } = await authService.signInWithGoogle();

            // Verify token with backend
            const response = await fetch("http://localhost:3003/verify-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: firebaseToken }),
            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', firebaseToken);
                dispatch(setUser({
                    user: data.user,
                    token: firebaseToken
                }));
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Welcome to LetterFlow
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to start writing
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RiGoogleFill className="w-6 h-6" />
                        <span>Sign in with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;