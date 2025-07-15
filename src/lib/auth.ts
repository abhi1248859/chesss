'use client';

import { auth } from './firebase';
import { GithubAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const githubProvider = new GithubAuthProvider();

export async function signInWithGitHub() {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    // This gives you a GitHub Access Token. You can use it to access the GitHub API.
    // const credential = GithubAuthProvider.credentialFromResult(result);
    // const token = credential?.accessToken;
    // const user = result.user;
    return result.user;
  } catch (error) {
    // Handle Errors here.
    console.error("Authentication Error:", error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign Out Error:", error);
    throw error;
  }
}
