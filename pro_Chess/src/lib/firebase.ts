'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In a real-world app, you would load this from environment variables
// For Firebase Studio, these values are automatically replaced during the build process.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This check is crucial for deployments. If the environment variables are not set,
// the build will fail with a clear and helpful error message.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // In a build environment, this will stop the build and log the error.
  // In a browser, it will show the error in the console.
  // In Firebase Studio, these should be populated automatically.
  console.warn(
    'Firebase config is not set. Please ensure you have set them in your environment settings for deployment. In Firebase Studio, these should be populated automatically.'
  );
}


// Initialize Firebase
// This check prevents re-initialization on hot-reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
