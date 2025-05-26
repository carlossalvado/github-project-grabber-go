
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useUserCache } from '@/hooks/useUserCache';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Aguardar um pouco para garantir que os hooks estejam prontos
          setTimeout(async () => {
            await handleUserLogin(session.user);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          handleUserLogout();
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

  const handleUserLogin = async (user: User) => {
    const { fetchUserDataFromSupabase } = useSupabaseSync();
    const { saveProfile, saveAgent, clearCache } = useUserCache();

    try {
      console.log('Usuário logado, buscando dados do Supabase...');
      
      // Buscar dados do Supabase
      const supabaseData = await fetchUserDataFromSupabase();
      
      if (supabaseData?.profile) {
        // Salvar perfil no cache
        saveProfile({
          id: user.id,
          full_name: supabaseData.profile.full_name,
          email: user.email || ''
        });
        
        // Se há agente selecionado, salvar no cache também
        if (supabaseData.agent) {
          saveAgent({
            agent_id: supabaseData.agent.agent_id,
            nickname: supabaseData.agent.nickname
          });
        }
      } else {
        console.log('Nenhum perfil encontrado no Supabase');
      }
    } catch (error) {
      console.error('Erro ao buscar dados após login:', error);
    }
  };

  const handleUserLogout = () => {
    const { clearCache } = useUserCache();
    clearCache();
    console.log('Usuário deslogado, cache limpo');
  };

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
    const { data, error } = await supabase.auth.signUp({
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

    // Após registro bem-sucedido, salvar no cache e Supabase
    if (data.user) {
      const { saveToSupabase } = useSupabaseSync();
      const { saveProfile } = useUserCache();

      // Salvar no cache
      saveProfile({
        id: data.user.id,
        full_name: fullName,
        email: email
      });

      // Salvar no Supabase
      await saveToSupabase('profile', { full_name: fullName });
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
