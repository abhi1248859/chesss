'use client';

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { toast } from '@/hooks/use-toast';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    if (!auth) {
        throw new Error("Firebase Auth is not initialized.");
    }
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google: ', error);
    let description = 'Could not sign in. Please try again.';
    
    // Check for specific Firebase error codes
    if (error.code === 'auth/unauthorized-domain') {
      description = 'This app\'s domain is not authorized for sign-in. Please add it to the "Authorized domains" list in your Firebase project\'s Authentication settings.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      description = 'Sign-in cancelled.';
    } else {
      description = `An unexpected error occurred. (${error.code || 'Unknown error'})`;
    }

    toast({
      title: 'Authentication Error',
      description: description,
      variant: 'destructive',
    });
    return null;
  }
};

export const signOutUser = async () => {
  try {
    if (!auth) {
        throw new Error("Firebase Auth is not initialized.");
    }
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out: ', error);
    toast({
      title: 'Sign-out Error',
      description: 'Could not sign out. Please try again.',
      variant: 'destructive',
    });
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};