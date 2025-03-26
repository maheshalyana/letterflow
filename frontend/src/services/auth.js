import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

class AuthService {
    constructor() {
        this.auth = auth;
        this.provider = new GoogleAuthProvider();
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.provider);
            const firebaseToken = await result.user.getIdToken();

            return {
                user: result.user,
                firebaseToken
            };
        } catch (error) {
            console.error('Auth Error:', error);
            throw error;
        }
    }
}

export default new AuthService(); 