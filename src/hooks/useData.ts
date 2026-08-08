import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, setDoc, doc, deleteDoc, updateDoc, orderBy, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, Budget, Goal, Subscription } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

// Using onSnapshot for realtime updates (requested instant UI updates)
export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      queryClient.setQueryData(['transactions', user.uid], txns.sort((a, b) => b.date - a.date));
    }, (error) => {
      console.error("Error in transactions snapshot:", error);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['transactions', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      return txns.sort((a, b) => b.date - a.date);
    },
    enabled: !!user,
    staleTime: Infinity, // handled by snapshot
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txn: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) throw new Error("No user");
      const fullTxn: Omit<Transaction, 'id'> = {
        ...txn,
        userId: user.uid,
        createdAt: Date.now(),
      };
      
      const cleanTxn = Object.fromEntries(Object.entries(fullTxn).filter(([_, v]) => v !== undefined));
      const docRef = await addDoc(collection(db, 'transactions'), cleanTxn as any);
      return { id: docRef.id, ...fullTxn };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const txnRef = doc(db, 'transactions', id);
      const snap = await getDoc(txnRef);
      if (snap.exists()) {
        const txnData = snap.data() as Transaction;
        await updateDoc(txnRef, { deletedAt: Date.now() });

        // If this transaction was a repayment for a borrowed item, revert borrowed item
        if (txnData.relatedBorrowedId) {
          try {
            await updateDoc(doc(db, 'transactions', txnData.relatedBorrowedId), { repaid: false });
          } catch (e) {
            console.warn("Could not revert borrowed status:", e);
          }
        }

        // If this transaction was for a fixed cost subscription payment, revert sub lastPaidMonth
        if (txnData.relatedSubscriptionId) {
          try {
            const subRef = doc(db, 'subscriptions', txnData.relatedSubscriptionId);
            const subSnap = await getDoc(subRef);
            if (subSnap.exists()) {
              const subData = subSnap.data() as Subscription;
              if (subData.lastPaidMonth === txnData.paidMonth) {
                await updateDoc(subRef, { lastPaidMonth: '' });
              }
            }
          } catch (e) {
            console.warn("Could not revert subscription paid month:", e);
          }
        }
      } else {
        await updateDoc(txnRef, { deletedAt: Date.now() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err) => console.error("Error deleting:", err)
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Transaction> & { id: string }) => {
      await updateDoc(doc(db, 'transactions', id), data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err) => console.error("Error updating transaction:", err)
  });
}

export function useRestoreTransaction() {
  return useMutation({
    mutationFn: async (id: string) => {
      await updateDoc(doc(db, 'transactions', id), { deletedAt: null });
    }
  });
}

export function useSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      queryClient.setQueryData(['subscriptions', user.uid], subs);
    }, (error) => {
      console.warn("Subscriptions snapshot error (likely missing rules):", error);
    });
    return () => unsubscribe();
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['subscriptions', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      try {
        const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      } catch (error) {
        console.warn("Subscriptions fetch error:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}

export function useAddSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Omit<Subscription, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) throw new Error("No user");
      const fullSub: Omit<Subscription, 'id'> = {
        ...sub,
        userId: user.uid,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, 'subscriptions'), fullSub);
      return { id: docRef.id, ...fullSub };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Subscription> & { id: string }) => {
      await updateDoc(doc(db, 'subscriptions', id), data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
}

export function useAddGoal() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => {
      if (!user) throw new Error("No user");
      const fullGoal: Omit<Goal, 'id'> = {
        ...goal,
        userId: user.uid,
        currentAmount: 0,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, 'goals'), fullGoal);
      return { id: docRef.id, ...fullGoal };
    }
  });
}

export function useBudget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        queryClient.setQueryData(['budget', user.uid], { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Budget);
      }
    });
    return () => unsubscribe();
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['budget', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Budget;
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}

export function useUpdateBudget() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (budget: Partial<Budget>) => {
      if (!user) throw new Error("No user");
      const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new budget
        const fullBudget = { ...budget, userId: user.uid };
        const docRef = await addDoc(collection(db, 'budgets'), fullBudget);
        return { id: docRef.id, ...fullBudget };
      } else {
        // Update existing
        const docId = snapshot.docs[0].id;
        await setDoc(doc(db, 'budgets', docId), budget, { merge: true });
        return { id: docId, ...snapshot.docs[0].data(), ...budget };
      }
    }
  });
}

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      queryClient.setQueryData(['goals', user.uid], goals);
    });
    return () => unsubscribe();
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['goals', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}
