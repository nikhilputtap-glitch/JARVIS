import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

let isAuthenticatingGlobal = false;

export const signInWithGoogle = async () => {
  if (isAuthenticatingGlobal) {
    console.warn("Authentication already in progress.");
    return null;
  }
  isAuthenticatingGlobal = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      localStorage.setItem('google_access_token', token);
    }
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.log("Google sign-in popup closed by user.");
      return null;
    }
    console.error("Error signing in with Google", error);
    throw error;
  } finally {
    isAuthenticatingGlobal = false;
  }
};

export const logOut = async () => {
  await signOut(auth);
  localStorage.removeItem('google_access_token');
};

export interface Memory {
  content: string;
  timestamp: Date;
  type: 'conversation' | 'preference';
}

export const saveMemory = async (userId: string, memory: Memory) => {
  if (!userId) return;
  const memoriesRef = collection(db, `users/${userId}/memories`);
  await addDoc(memoriesRef, {
    ...memory,
    content: memory.content.substring(0, 999),
    userId,
    timestamp: Timestamp.fromDate(memory.timestamp),
  });
};

export const getRecentMemories = async (userId: string, limitCount: number = 10) => {
  const memoriesRef = collection(db, `users/${userId}/memories`);
  const q = query(memoriesRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Memory);
};
