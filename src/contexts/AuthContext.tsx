
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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

  // Função para buscar dados do Supabase
  const fetchUserDataFromSupabase = async (userId: string) => {
    try {
      console.log('Buscando dados do usuário no Supabase...');

      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return null;
      }

      // Buscar agente selecionado
      const { data: agentData, error: agentError } = await supabase
        .from('user_selected_agent')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (agentError) {
        console.error('Erro ao buscar agente:', agentError);
      }

      console.log('Dados buscados do Supabase:', { profileData, agentData });

      return {
        profile: profileData,
        agent: agentData
      };
    } catch (error) {
      console.error('Erro geral ao buscar dados:', error);
      return null;
    }
  };

  // Função para salvar no cache
  const saveToCache = (type: 'profile' | 'agent' | 'plan', data: any) => {
    try {
      const timestamp = Date.now();
      const cacheKey = type === 'profile' ? 'sweet-ai-user-profile' : 
                      type === 'agent' ? 'sweet-ai-user-agent' : 
                      'sweet-ai-user-plan';
      
      const dataWithTimestamp = { ...data, cached_at: timestamp };
      localStorage.setItem(cacheKey, JSON.stringify(dataWithTimestamp));
      console.log(`${type} salvo no cache:`, dataWithTimestamp);
    } catch (error) {
      console.error(`Erro ao salvar ${type} no cache:`, error);
    }
  };

  // Função para limpar cache
  const clearCache = () => {
    localStorage.removeItem('sweet-ai-user-profile');
    localStorage.removeItem('sweet-ai-user-agent');
    localStorage.removeItem('sweet-ai-user-plan');
    console.log('Cache limpo');
  };

  // Função para lidar com login do usuário
  const handleUserLogin = async (user: User) => {
    try {
      console.log('Usuário logado, buscando dados do Supabase...');
      
      // Buscar dados do Supabase
      const supabaseData = await fetchUserDataFromSupabase(user.id);
      
      if (supabaseData?.profile) {
        // Salvar perfil no cache
        saveToCache('profile', {
          id: user.id,
          full_name: supabaseData.profile.full_name,
          email: user.email || '',
          plan_name: supabaseData.profile.plan_name,
          plan_active: supabaseData.profile.plan_active
        });
        
        // Se há agente selecionado, salvar no cache também
        if (supabaseData.agent) {
          saveToCache('agent', {
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

  // Função para lidar com logout do usuário
  const handleUserLogout = () => {
    clearCache();
    console.log('Usuário deslogado, cache limpo');
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Aguardar um pouco para garantir que o componente esteja pronto
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
      // Salvar no cache
      saveToCache('profile', {
        id: data.user.id,
        full_name: fullName,
        email: email,
        plan_name: null,
        plan_active: false
      });

      // Salvar no Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Erro ao salvar perfil no Supabase:', profileError);
      } else {
        console.log('Perfil salvo no Supabase com sucesso');
      }
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
