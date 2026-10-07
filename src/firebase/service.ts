import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { OperationType, handleFirestoreError } from './errorHandler';
import { Transaction, Budget } from '../types';

const TRANSACTIONS_PATH = 'transactions';
const BUDGETS_PATH = 'budgets';

export function subscribeUserTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, TRANSACTIONS_PATH),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          type: data.type,
          amount: Number(data.amount) || 0,
          category: data.category || 'อื่นๆ',
          title: data.title || '',
          date: data.date || '',
          paymentMethod: data.paymentMethod,
          note: data.note,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      // Sort client-side by date desc, then createdAt desc
      items.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      callback(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, TRANSACTIONS_PATH);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function addTransaction(
  item: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    userId: item.userId,
    type: item.type,
    amount: Number(item.amount),
    category: item.category.trim(),
    title: item.title.trim(),
    date: item.date,
    createdAt: now,
    updatedAt: now,
  };

  if (item.paymentMethod?.trim()) {
    payload.paymentMethod = item.paymentMethod.trim();
  }
  if (item.note?.trim()) {
    payload.note = item.note.trim();
  }

  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_PATH), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TRANSACTIONS_PATH);
  }
}

export async function updateTransaction(
  id: string,
  item: Partial<Transaction>
): Promise<void> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    ...item,
    updatedAt: now,
  };
  delete payload.id; // Don't write document id as a field

  try {
    const docRef = doc(db, TRANSACTIONS_PATH, id);
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TRANSACTIONS_PATH}/${id}`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const docRef = doc(db, TRANSACTIONS_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TRANSACTIONS_PATH}/${id}`);
  }
}

export function subscribeUserBudgets(
  userId: string,
  callback: (budgets: Budget[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, BUDGETS_PATH),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Budget[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          month: data.month,
          category: data.category,
          amount: Number(data.amount) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      callback(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, BUDGETS_PATH);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveBudget(
  userId: string,
  month: string,
  category: string,
  amount: number,
  existingId?: string
): Promise<string> {
  const now = new Date().toISOString();
  try {
    if (existingId) {
      const docRef = doc(db, BUDGETS_PATH, existingId);
      await updateDoc(docRef, {
        amount: Number(amount),
        updatedAt: now,
      });
      return existingId;
    } else {
      const payload = {
        userId,
        month,
        category,
        amount: Number(amount),
        createdAt: now,
        updatedAt: now,
      };
      const docRef = await addDoc(collection(db, BUDGETS_PATH), payload);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `${BUDGETS_PATH}/${existingId}` : BUDGETS_PATH
    );
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    const docRef = doc(db, BUDGETS_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BUDGETS_PATH}/${id}`);
  }
}
