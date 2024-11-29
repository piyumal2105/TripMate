import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the service account file path from the environment variables
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is not set in the .env file");
}

// Read and parse the service account JSON
let serviceAccount;
try {
  const serviceAccountContent = fs.readFileSync(serviceAccountPath, "utf-8");
  serviceAccount = JSON.parse(serviceAccountContent);
} catch (error) {
  throw new Error(
    "Failed to read or parse the Firebase service account JSON: " +
      error.message
  );
}

// Initialize Firebase Admin SDK with the provided service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("🔥 Firebase successfully connected!");

// Initialize Firebase Authentication
const auth = admin.auth();

// Optionally, you can also initialize Firestore if needed
const firestore = admin.firestore();

// Export the Firebase Auth and Firestore instances
export { auth, firestore };
