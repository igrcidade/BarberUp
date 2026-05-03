import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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
    let profileUnsubscribe: () => void;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
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
          }
        }, (error) => {
          console.error("Error fetching user profile stream:", error);
        });
      } else {
        setProfile(null);
        if (profileUnsubscribe) profileUnsubscribe();
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const isAdmin = user?.email === 'igor.cidade@hotmail.com' || user?.email === 'igrcidade@gmail.com';
  
  // Custom profile for Admin to avoid trial banners and ensure active state
  // Even if profile is null, if isAdmin is true, we provide a master profile
  const effectiveProfile = isAdmin ? (profile ? {
    ...profile,
    subscriptionStatus: 'active' as const,
    subscriptionPlan: 'master'
  } : {
    name: user?.displayName || 'Master Admin',
    barbershopName: 'Central BarberUp',
    subscriptionStatus: 'active' as const,
    subscriptionPlan: 'master',
    subscriptionEnd: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
    createdAt: new Date().toISOString()
  }) : profile;

  // They are active if they are admin, or if their subscription is 'active' or 'trial'
  const isProfileActive = effectiveProfile?.subscriptionStatus === 'active' || effectiveProfile?.subscriptionStatus === 'trial';
  const isActive = isAdmin || isProfileActive;

  return (
    <AuthContext.Provider value={{ user, profile: effectiveProfile, loading, isAdmin, isActive }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
