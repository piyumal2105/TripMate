// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYWUyEAJhMb-8OaO72zgTdWbN5rhh1nzs",
  authDomain: "travel-planner-89979.firebaseapp.com",
  projectId: "travel-planner-89979",
  storageBucket: "travel-planner-89979.appspot.com", // Fixed incorrect storageBucket URL
  messagingSenderId: "458478614611",
  appId: "1:458478614611:web:ce9881ec3e89685f3e2ea6",
  measurementId: "G-D1P6F4TLDS",
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export initialized instances
export { app, auth, db, collection, addDoc, doc, updateDoc, increment };
