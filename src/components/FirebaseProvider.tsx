import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, deleteDoc, getDocs, query, collection, where, updateDoc, serverTimestamp } from 'firebase/firestore';

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
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Only update status if it's a new login or change
      if (currentUser && (!user || currentUser.uid !== user.uid)) {
        setLoading(true);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            isOnline: true,
            lastLogin: serverTimestamp(),
            lastActive: serverTimestamp()
          }).catch(e => console.warn("Status update error (non-critical):", e.message));
        } catch (err) {
          console.warn("Could not check user status before update:", err);
        }
      } else if (!currentUser && user) {
        // User logged out - update status to offline
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            isOnline: false,
            lastLogout: serverTimestamp(),
            lastActive: serverTimestamp()
          }).catch(e => console.warn("Status update error (non-critical):", e.message));
        } catch (err) {
          console.warn("Could not set offline status:", err);
        }
      }
      setUser(currentUser);
      
      // Clean up previous snapshot listener if it exists
      if (unsubData) {
        unsubData();
        unsubData = null;
      }

      if (currentUser) {
        unsubData = onSnapshot(doc(db, 'users', currentUser.uid), async (snapshot) => {
          const data = snapshot.data();
          if (!snapshot.exists()) {
            // User authenticated but doc missing - might be a mismatch of doc IDs (e.g. phone/email is used as doc ID, or old record)
            // Let's perform self-healing: query by phone formats or email to locate their profile
            try {
              const emailVal = currentUser.email || '';
              let phoneFromEmail = '';
              if (emailVal.endsWith('@melikekub.com')) {
                phoneFromEmail = emailVal.split('@')[0];
              }

              let foundData: any = null;
              let foundDocId: string | null = null;

              if (phoneFromEmail) {
                const cleanPhone = phoneFromEmail.trim().replace(/\D/g, '');
                const nineDigit = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
                const countryCodeOnly = `251${nineDigit}`;
                const formats = [cleanPhone, '0' + nineDigit, nineDigit, countryCodeOnly];

                const q = query(collection(db, 'users'), where('phone', 'in', formats));
                const qSnap = await getDocs(q);
                if (!qSnap.empty) {
                  foundDocId = qSnap.docs[0].id;
                  foundData = qSnap.docs[0].data();
                }
              }

              if (!foundData && emailVal) {
                // Secondary check by email
                const q = query(collection(db, 'users'), where('email', '==', emailVal.toLowerCase().trim()));
                const qSnap = await getDocs(q);
                if (!qSnap.empty) {
                  foundDocId = qSnap.docs[0].id;
                  foundData = qSnap.docs[0].data();
                }
              }

              if (foundData) {
                console.log("Self-healing triggered: Found user doc under ID:", foundDocId, "for uid:", currentUser.uid);
                const healedData = {
                  ...foundData,
                  uid: currentUser.uid,
                };
                
                // Set the correct doc in Firestore
                await setDoc(doc(db, 'users', currentUser.uid), healedData, { merge: true });

                // Delete the old mismatched doc if it has a different ID to prevent duplicate listings
                if (foundDocId !== currentUser.uid) {
                  try {
                    await deleteDoc(doc(db, 'users', foundDocId!));
                  } catch (delErr) {
                    console.warn("Could not delete old mismatched doc:", delErr);
                  }
                }

                setUserData(healedData);
                setLoading(false);
              } else {
                setUserData(null);
                setLoading(false);
              }
            } catch (healError) {
              console.error("Self-healing error:", healError);
              setUserData(null);
              setLoading(false);
            }
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

  // Heartbeat & Online Presence Tracking
  useEffect(() => {
    if (!user) return;

    // Periodic heartbeat every 60s
    const heartbeatInterval = setInterval(() => {
      try {
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: true,
          lastActive: serverTimestamp()
        }).catch(() => {});
      } catch (e) {}
    }, 60000);

    const handleBeforeUnload = () => {
      try {
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastLogout: serverTimestamp(),
          lastActive: serverTimestamp()
        }).catch(() => {});
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

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
