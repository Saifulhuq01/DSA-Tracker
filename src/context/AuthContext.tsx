'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { auth, db, googleProvider, hasValidConfig } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isConfigured: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasValidConfig || !auth) {
      setLoading(false);
      return;
    }

    import('firebase/auth').then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Sync user profile to Firestore
          if (db) {
            try {
              const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
              const userRef = doc(db, 'users', firebaseUser.uid);
              const userSnap = await getDoc(userRef);
              if (!userSnap.exists()) {
                await setDoc(userRef, {
                  displayName: firebaseUser.displayName,
                  email: firebaseUser.email,
                  photoURL: firebaseUser.photoURL,
                  createdAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                });
              } else {
                await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
              }
            } catch (e) {
              console.warn('Firestore user sync failed:', e);
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!hasValidConfig || !auth || !googleProvider) return;
    try {
      const { signInWithPopup } = await import('firebase/auth');
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google sign-in error:', error);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!hasValidConfig || !auth) return;
    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isConfigured: hasValidConfig }}>
      {children}
    </AuthContext.Provider>
  );
}
