import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: 'personal' | 'organization_admin';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface StoredUser {
  id: string;
  email: string;
  password: string;
  full_name: string | null;
  avatar_url?: string | null;
  account_type?: 'personal' | 'organization_admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const USERS_KEY = 'unify_users';
const CURRENT_USER_KEY = 'unify_current_user';

const getStoredUsers = (): StoredUser[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

const getProfile = (userId: string): Profile | null => {
  const users = getStoredUsers();
  const storedUser = users.find(u => u.id === userId);
  if (!storedUser) return null;
  
  return {
    id: storedUser.id,
    email: storedUser.email,
    full_name: storedUser.full_name,
    avatar_url: storedUser.avatar_url || null,
    account_type: storedUser.account_type || 'personal',
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const profileData = getProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Check for existing session
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      const profileData = getProfile(storedUser.id);
      setProfile(profileData);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: Error | null }> => {
    try {
      const users = getStoredUsers();
      
      // Check if user already exists
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: new Error('This email is already registered') };
      }

      // Create new user
      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        password,
        full_name: fullName,
        avatar_url: null,
        account_type: 'personal',
      };

      users.push(newUser);
      saveUsers(users);

      // Auto sign in after signup
      const userWithoutPassword: User = {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
      };
      
      setCurrentUser(userWithoutPassword);
      setUser(userWithoutPassword);
      
      const profileData = getProfile(newUser.id);
      setProfile(profileData);

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const users = getStoredUsers();
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        return { error: new Error('Invalid email or password') };
      }

      const userWithoutPassword: User = {
        id: foundUser.id,
        email: foundUser.email,
        full_name: foundUser.full_name,
      };

      setCurrentUser(userWithoutPassword);
      setUser(userWithoutPassword);
      
      const profileData = getProfile(foundUser.id);
      setProfile(profileData);

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    setCurrentUser(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
