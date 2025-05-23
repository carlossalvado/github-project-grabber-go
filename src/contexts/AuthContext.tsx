
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar dados do usuário do Supabase e salvar no cache
  const loadUserDataToCache = async (userId: string) => {
    try {
      console.log("Carregando dados do usuário do Supabase para o cache:", userId);
      
      // Buscar dados do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('plan_name, plan_active')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
      }
      
      // Buscar dados da assinatura
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_name, status, start_date, end_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (subscriptionError) {
        console.error("Erro ao buscar assinatura:", subscriptionError);
      }
      
      // Salvar dados no cache
      if (profileData || subscriptionData) {
        const cacheData = {
          plan_name: subscriptionData?.plan_name || profileData?.plan_name || null,
          plan_active: subscriptionData?.status === 'active' || profileData?.plan_active || false,
          cached_at: Date.now()
        };
        
        localStorage.setItem('sweet-ai-user-profile', JSON.stringify(cacheData));
        console.log("Dados do usuário salvos no cache:", cacheData);
        
        // Se há assinatura ativa, salvar também no cache de assinatura
        if (subscriptionData?.status === 'active') {
          const subscriptionCache = {
            id: crypto.randomUUID(),
            user_id: userId,
            plan_id: 1, // ID genérico
            plan_name: subscriptionData.plan_name,
            status: subscriptionData.status,
            start_date: subscriptionData.start_date,
            end_date: subscriptionData.end_date,
            cached_at: Date.now()
          };
          
          localStorage.setItem('sweet-ai-subscription-data', JSON.stringify(subscriptionCache));
          console.log("Dados de assinatura salvos no cache:", subscriptionCache);
        }
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados para o cache:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Quando o usuário faz login, carregar dados do Supabase para o cache
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            await loadUserDataToCache(session.user.id);
            
            // Redirecionar para o perfil após login confirmado e dados carregados
            console.log("Redirecionando para o perfil após login");
            window.location.href = '/profile';
          }, 100);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
