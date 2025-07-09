'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded Firebase configuration for the 'tactical-intellect' project
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAruLbgL3dZk4roy9KkDbTEOks4Mv0u_-M",
  authDomain: "tactical-intellect.firebaseapp.com",
  projectId: "tactical-intellect",
  storageBucket: "tactical-intellect.appspot.com",
  messagingSenderId: "1022978117758",
  appId: "1:1022978117758:web:a54fb34c8db511c81b082f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
