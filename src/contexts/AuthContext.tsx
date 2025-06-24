import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, planType?: string) => Promise<void>;
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

  // Função para limpar cache quando usuário faz logout
  const clearUserCache = () => {
    localStorage.removeItem('sweet-ai-user-profile');
    localStorage.removeItem('sweet-ai-user-agent');
    localStorage.removeItem('sweet-ai-user-plan');
    localStorage.removeItem('sweet-ai-user-trial');
    console.log('🗑️ Cache do usuário limpo no logout');
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          clearUserCache();
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

  const signUp = async (email: string, password: string, fullName: string, planType?: string) => {
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

    // Após registro bem-sucedido, criar perfil no Supabase
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            plan_name: planType || null,
            plan_active: planType ? true : false,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Erro ao salvar perfil no Supabase:', profileError);
        } else {
          console.log('✅ Perfil salvo no Supabase com sucesso');
        }

        // Se for plano trial, iniciar o trial
        if (planType === 'trial') {
          try {
            const { error: trialError } = await supabase.rpc('start_trial', {
              user_uuid: data.user.id
            });

            if (trialError) {
              console.error('Erro ao iniciar trial:', trialError);
            } else {
              console.log('✅ Trial iniciado com sucesso');
            }
          } catch (error) {
            console.error('Erro ao processar trial:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao processar dados pós-registro:', error);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    // O cache será limpo automaticamente pelo listener de auth state
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