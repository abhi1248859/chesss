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
    toast({
      title: 'Authentication Error',
      description: 'Could not sign in. Please ensure your Firebase project is configured correctly and Google Sign-In is enabled.',
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
