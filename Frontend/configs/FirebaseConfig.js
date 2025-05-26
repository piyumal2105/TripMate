
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZkr_C-xOXTrAw2IrdW2RSCMnt1xt2J6c",
  authDomain: "ai-trip-planner-3723f.firebaseapp.com",
  projectId: "ai-trip-planner-3723f",
  storageBucket: "ai-trip-planner-3723f.appspot.com",
  messagingSenderId: "243962249893",
  appId: "1:243962249893:web:154baafb8d4bcbaccec34c",
  measurementId: "G-J6Z5LYR9Y1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app);