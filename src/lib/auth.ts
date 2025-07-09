'use client';

import {
  signInWithRedirect,
  getRedirectResult,
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
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error('Error starting sign-in redirect: ', error);
    toast({
      title: 'Authentication Error',
      description: 'Could not start the sign-in process. Please try again.',
      variant: 'destructive',
    });
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
    
    // Check for redirect result when the app loads.
    getRedirectResult(auth)
      .catch((error: any) => {
        // Handle Errors here. This is where errors from the redirect flow will be caught.
        console.error('Error from redirect result: ', error);
        let description = 'Could not complete sign-in. Please try again.';
        if (error.code === 'auth/unauthorized-domain') {
          description = 'This app\'s domain is not authorized for sign-in. Please check your Firebase project settings.';
        } else {
          description = `An unexpected error occurred. (${error.code || 'Unknown error'})`;
        }
        toast({
          title: 'Authentication Error',
          description: description,
          variant: 'destructive',
        });
      });

    return onAuthStateChanged(auth, callback);
};
