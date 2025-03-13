import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDLZG2arBkbGvkt82KktyXJhQY68YVJUcU",
  authDomain: "tripmate-ec1fe.firebaseapp.com",
  databaseURL: "https://tripmate-ec1fe-default-rtdb.firebaseio.com",
  projectId: "tripmate-ec1fe",
  storageBucket: "tripmate-ec1fe.firebasestorage.app",
  messagingSenderId: "1024669533218",
  appId: "1:1024669533218:web:6f9ce2925d3682de04b67b",
  measurementId: "G-RFEX7ZCDLD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
