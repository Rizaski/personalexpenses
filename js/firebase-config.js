// Firebase Configuration
// TODO: Replace with your Firebase project configuration
// You can find this in your Firebase Console -> Project Settings -> General -> Your apps

const firebaseConfig = {
    apiKey: "AIzaSyD9myt189w1KWFrmNkNJPWBTSnTcQYD26A",
    authDomain: "personalexpenses-8763d.firebaseapp.com",
    projectId: "personalexpenses-8763d",
    storageBucket: "personalexpenses-8763d.firebasestorage.app",
    messagingSenderId: "394451487547",
    appId: "1:394451487547:web:6750a0d5dcd5f559f8051e"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Store Firebase services globally
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" &&
        firebaseConfig.authDomain !== "YOUR_AUTH_DOMAIN" &&
        firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase configuration required! Please update js/firebase-config.js with your Firebase credentials.');
}