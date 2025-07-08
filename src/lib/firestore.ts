import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  maxUnlockedDifficulty: number;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  } else {
    // If user profile doesn't exist, create one with default values
    const defaultProfile: UserProfile = { maxUnlockedDifficulty: 50 };
    await setDoc(userDocRef, defaultProfile);
    return defaultProfile;
  }
};

export const unlockPremiumFeatures = async (uid: string): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    maxUnlockedDifficulty: 100,
    paymentStatus: {
        paid: true,
        amount: 10,
        method: "UPI",
        time: new Date().toISOString()
    }
  });
};
