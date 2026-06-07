import { db, auth } from './firebaseService';
import { collection, addDoc, query, getDocs, Timestamp } from 'firebase/firestore';

export async function addMemory(content: string, type: 'conversation' | 'preference'): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn('User not authenticated, skipping memory save');
    return false;
  }
  
  await addDoc(collection(db, `users/${userId}/memories`), {
    userId,
    content,
    timestamp: Timestamp.now(),
    type
  });
  return true;
}

export async function getMemories() {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  const q = query(collection(db, `users/${userId}/memories`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
