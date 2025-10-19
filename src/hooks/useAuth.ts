import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há uma sessão ativa
    const getInitialSession = async () => {
      try {
        const response = await supabase.auth.getSession();
        const session = response?.data?.session;
        setUser(session?.user ?? null);
      } catch (error) {
        console.log('Erro ao obter sessão:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    try {
      const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        if (subscription?.data?.subscription?.unsubscribe) {
          subscription.data.subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.log('Erro ao configurar listener de auth:', error);
      setLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('Tentando login com:', email);
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Resposta do login:', response);
      
      if (response.error) {
        return { error: response.error };
      }
      
      if (response.data?.user) {
        setUser(response.data.user);
      }
      
      return { error: null };
    } catch (error) {
      console.log('Erro no login:', error);
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('Tentando cadastro com:', email);
      const response = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log('Resposta do cadastro:', response);
      return { error: response.error };
    } catch (error) {
      console.log('Erro no cadastro:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Fazendo logout');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.log('Erro ao fazer signOut:', error);
    }
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};