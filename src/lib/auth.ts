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

/**
 * Initiates the Google sign-in process using a redirect.
 * This is more reliable on mobile devices than a popup.
 */
export const signInWithGoogle = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized.");
    }
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error('Error starting sign-in redirect: ', error);
    
    let description = 'Could not start the sign-in process. Please try again.';
    if (error.code === 'auth/unauthorized-domain') {
      description = 'This website\'s domain is not authorized for sign-in. Please add it to your Firebase project\'s authentication settings.';
    } else if (error.code) {
      description = `An unexpected error occurred: ${error.message}`;
    }

    toast({
      title: 'Authentication Error',
      description: description,
      variant: 'destructive',
    });
  }
};

/**
 * Signs out the current user.
 */
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

/**
 * Sets up an authentication state listener.
 * It also handles the result of a sign-in redirect when the page loads.
 * @param callback A function to be called when the auth state changes.
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.error("Firebase Auth is not initialized. Skipping auth listener.");
    callback(null);
    return () => {}; // Return an empty unsubscribe function
  }
  
  // This promise resolves with the user credential on a successful redirect.
  // It should be called when the page loads to complete the sign-in process.
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        // This was a successful sign-in redirect.
        // The onAuthStateChanged listener below will handle the user state update.
        // You could add a welcome toast here if you want.
        // toast({ title: `Welcome, ${result.user.displayName}!`});
      }
    })
    .catch((error) => {
      // Handle Errors here.
      console.error('Error from getRedirectResult: ', error);
      
      // Don't show a toast for user-cancelled actions.
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
          return;
      }
      
      let description = 'Could not complete sign-in. Please try again.';
      if (error.code === 'auth/unauthorized-domain') {
        description = 'This app\'s domain is not authorized for sign-in. Please check your Firebase project settings.';
      } else {
        description = `An unexpected error occurred: ${error.message}`;
      }
      
      toast({
        title: 'Authentication Error',
        description: description,
        variant: 'destructive',
      });
    });

  // onAuthStateChanged returns the unsubscribe function.
  return onAuthStateChanged(auth, callback);
};
