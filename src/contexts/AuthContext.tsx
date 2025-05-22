
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Chave para armazenar na cache do usuário
const USER_AUTH_CACHE_KEY = 'sweet-ai-user-auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper para armazenar dados de autenticação em cache
  const saveUserToCache = (user: User | null, session: Session | null) => {
    if (user && session) {
      const cacheData = {
        user,
        session,
        timestamp: Date.now()
      };
      localStorage.setItem(USER_AUTH_CACHE_KEY, JSON.stringify(cacheData));
      console.log("Dados do usuário salvos em cache");
    }
  };

  // Helper para limpar o cache de autenticação
  const clearUserCache = () => {
    localStorage.removeItem(USER_AUTH_CACHE_KEY);
    console.log("Cache de autenticação limpo");
  };

  useEffect(() => {
    console.log("Current path:", location.pathname);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Se o usuário fez login, salvar em cache
        if (event === 'SIGNED_IN' && session?.user) {
          saveUserToCache(session.user, session);
          console.log("User signed in, redirecting to /home");
          setTimeout(() => navigate('/home'), 100);
        }
        
        // Se o usuário fez logout, limpar o cache
        if (event === 'SIGNED_OUT') {
          clearUserCache();
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Got existing session:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Se encontramos uma sessão válida, salvar em cache
      if (session?.user) {
        saveUserToCache(session.user, session);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) throw error;
      toast.success("Conta criada com sucesso! Por favor, verifique seu email para confirmar sua conta.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Salvar dados de autenticação em cache após login bem-sucedido
      if (data.user && data.session) {
        saveUserToCache(data.user, data.session);
      }
      
      toast.success("Login realizado com sucesso!");
      console.log("Login successful, navigating to /profile");
      setTimeout(() => navigate('/profile'), 100);
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear localStorage before signing out
      clearUserCache();
      
      // Clear other Supabase auth related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth') || key.startsWith('user-plan-cache')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear session storage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // After signing out, redirect to the landing page
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Erro ao sair");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
