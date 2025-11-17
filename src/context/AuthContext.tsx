import { useRouter, useSegments } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { deleteFromStorage, getFromStorage, saveToStorage } from '../utils/storage';

interface User {
  username: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | string;
}

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  accessToken: string | null;
}

interface AuthContextType {
  state: AuthState;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    status: 'idle',
    user: null,
    accessToken: null,
  });

  const segments = useSegments();
  const router = useRouter();

  const decodeToken = (token: string): User | null => {
    try {
      const decoded: any = jwtDecode(token);

      let role = decoded.role || decoded.roles || decoded.authority || 'STUDENT';
      if (role.startsWith('ROLE_')) {
        role = role.replace('ROLE_', '');
      }

      return { username: decoded.sub, role };
    } catch (e) {
      console.error("Invalid token:", e);
      return null;
    }
  };

  const login = async (accessToken: string, refreshToken: string) => {
    const user = decodeToken(accessToken);

    if (!user) {
      await logout();
      return;
    }

    await saveToStorage('accessToken', accessToken);
    await saveToStorage('refreshToken', refreshToken);

    setState({ status: 'authenticated', user, accessToken });

    router.replace('/(app)' as any);
  };

  const logout = async () => {
    await deleteFromStorage('accessToken');
    await deleteFromStorage('refreshToken');
    setState({ status: 'unauthenticated', user: null, accessToken: null });

    router.replace('/(auth)/login');
  };

  useEffect(() => {
    const restoreSession = async () => {
      setState(prev => ({ ...prev, status: 'loading' }));
      try {
        const accessToken = await getFromStorage('accessToken');
        if (!accessToken) {
          setState({ status: 'unauthenticated', user: null, accessToken: null });
          return;
        }

        const user = decodeToken(accessToken);
        if (!user) {
          await logout();
          return;
        }

        setState({ status: 'authenticated', user, accessToken });
      } catch (err) {
        console.error("Session restore failed:", err);
        setState({ status: 'unauthenticated', user: null, accessToken: null });
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (state.status === 'idle' || state.status === 'loading') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (state.status === 'authenticated' && inAuthGroup) {
      router.replace('/(app)' as any);
    } else if (state.status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [state.status, segments, router]);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};