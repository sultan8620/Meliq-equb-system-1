import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const FirebaseContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null, 
  loading: true, 
  isAdmin: false,
  isSuperAdmin: false
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubData: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // If user logs in or switches, show loading until we fetch their data
      if (currentUser && (!user || currentUser.uid !== user.uid)) {
        setLoading(true);
      }
      setUser(currentUser);
      
      // Clean up previous snapshot listener if it exists
      if (unsubData) {
        unsubData();
        unsubData = null;
      }

      if (currentUser) {
        unsubData = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
          const data = snapshot.data();
          if (!snapshot.exists()) {
            // User authenticated but doc missing - might be in the middle of creation or deleted
            setUserData(null);
            setLoading(false);
          } else {
            setUserData(data || null);
            setLoading(false);
          }
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          console.trace("Firestore snapshot error trace");
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubData) unsubData();
    };
  }, []);

  const isSuperAdmin = user?.email?.toLowerCase() === 'sefadinkedir@gmail.com' || 
                       user?.email?.toLowerCase() === '0900000000@melikekub.com' || 
                       user?.email?.toLowerCase() === '900000000@melikekub.com' || 
                       user?.email?.toLowerCase() === '0986204981@melikekub.com' || 
                       user?.email?.toLowerCase()?.startsWith('admin.') ||
                       user?.uid === 'EbINObixvBPYds6caQQXkv1s0482' ||
                       userData?.role === 'super_admin';

  const isAdmin = isSuperAdmin || userData?.role === 'admin';

  return (
    <FirebaseContext.Provider value={{ user, userData, loading, isAdmin, isSuperAdmin }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useAuth = () => useContext(FirebaseContext);
