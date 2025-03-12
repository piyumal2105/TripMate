import firebase from "firebase/app";
import "firebase/auth"; // Firebase authentication
import "firebase/firestore"; // Firebase Firestore (if you need it)

const firebaseConfig = {
  apiKey: "AIzaSyBZQawz66tnMH_iitjpZkNd3Jd3Kw4EhK4",
  authDomain: "tripmate-69813.firebaseapp.com",
  projectId: "tripmate-69813",
  storageBucket: "tripmate-69813.firebasestorage.app",
  messagingSenderId: "688630563885",
  appId: "1:688630563885:web:40658c978af31ca532a4a4",
  measurementId: "G-8FPL2WF0XG",
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

// Export auth and firestore for usage in your app
const auth = firebaseApp.auth();
const db = firebaseApp.firestore();

export { auth, db };
