import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  name: string;
  barbershopName: string;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'expired' | 'trial';
  subscriptionEnd: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true, 
  isAdmin: false, 
  isActive: false 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Default profile for old users if not exists
            const defaultProfile = {
              name: currentUser.displayName || 'Usuário',
              barbershopName: 'Barbearia',
              subscriptionPlan: 'free',
              subscriptionStatus: 'trial' as const,
              subscriptionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString()
            };
            setProfile(defaultProfile);
            // We normally do setDoc during Registration, so let's ignore writing here to avoid rules blocks
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = user?.email === 'igor.cidade@hotmail.com';
  
  // They are active if they are admin, or if their subscription is 'active' or 'trial'
  // Let's also check subscriptionEnd date, but for now subscriptionStatus is enough
  const isProfileActive = profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trial';
  const isActive = isAdmin || isProfileActive;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isActive }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
