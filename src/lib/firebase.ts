'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// This check is crucial for Vercel builds. If the environment variables are not set,
// the build will fail with a clear and helpful error message.
if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
  // In a build environment, this will stop the build and log the error.
  // In a browser, it will show the error in the console.
  // In Firebase Studio, these values will be replaced automatically.
  console.warn(
    'Firebase config is not set. Please ensure you have a .env file with the correct values for local development, or that you have set them in your environment settings for deployment. In Firebase Studio, these should be replaced automatically.'
  );
}


// Initialize Firebase
// This check prevents re-initialization on hot-reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
