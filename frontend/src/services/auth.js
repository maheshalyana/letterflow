import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

class AuthService {
    constructor() {
        this.auth = auth;
        this.provider = new GoogleAuthProvider();
    }

    async signInWithGoogle() {
        try {
            console.log("Starting Google sign-in process");
            const result = await signInWithPopup(this.auth, this.provider);
            const user = result.user;
            console.log("Google sign-in successful:", user.displayName);

            // Get the Firebase ID token
            const firebaseToken = await user.getIdToken();
            console.log("Firebase token obtained");

            return { user, firebaseToken };
        } catch (error) {
            console.error('Auth Error:', error);
            throw error;
        }
    }
}

export default new AuthService(); 