// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBfvKbhyeLALuw_7YrJlzjTQZ5oRld0oZQ",
    authDomain: "letterflow-1.firebaseapp.com",
    projectId: "letterflow-1",
    storageBucket: "letterflow-1.firebasestorage.app",
    messagingSenderId: "798221185843",
    appId: "1:798221185843:web:fd52b6c6380603c5008446",
    measurementId: "G-GTTK8JE3SQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };

export default app;