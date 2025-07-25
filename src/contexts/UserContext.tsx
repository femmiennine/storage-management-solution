"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { UserRole } from '@/types/roles';

interface User {
  $id: string;
  email: string;
  name: string;
  prefs?: {
    avatar?: string;
    role?: UserRole;
  };
}

interface UserContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = user?.prefs?.role || (user ? UserRole.USER : UserRole.GUEST);
  const isAuthenticated = !!user;

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Map the Appwrite document to our User type
        const userData = {
          $id: currentUser.$id,
          email: currentUser.email,
          name: currentUser.fullName || currentUser.name,
          prefs: {
            avatar: currentUser.avatar,
            role: currentUser.role || UserRole.USER
          }
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  return (
    <UserContext.Provider value={{ user, role, isLoading, isAuthenticated, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}