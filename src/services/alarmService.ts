import { db, auth } from './firebaseService';
import { collection, addDoc, query, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';

export async function setAlarm(time: Date, label?: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  await addDoc(collection(db, `users/${userId}/alarms`), {
    userId,
    time: Timestamp.fromDate(time),
    label: label || '',
    active: true
  });
}

export async function getAlarms() {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  const q = query(collection(db, `users/${userId}/alarms`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
