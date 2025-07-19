import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../firebase';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
const auth = getAuth(app);
const db = getFirestore(app);
const [user, setUser] = useState(null); // Firebase user
const [role, setRole] = useState(null); // 'admin', 'viewer', etc.
const [loading, setLoading] = useState(true); // To avoid flicker

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
setUser(currentUser);
  if (currentUser) {
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setRole(docSnap.data().role);
    }
  } else {
    setRole(null);
  }

  setLoading(false);
});

return () => unsubscribe();
}, []);

return (
<UserContext.Provider value={{ user, role, loading }}>
{children}
</UserContext.Provider>
);
};