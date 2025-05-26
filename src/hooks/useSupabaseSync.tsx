
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSupabaseSync = () => {
  const { user } = useAuth();

  // Buscar dados do Supabase (apenas leitura)
  const fetchUserDataFromSupabase = async () => {
    if (!user) return null;

    try {
      console.log('Buscando dados do usuário no Supabase...');

      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return null;
      }

      // Buscar agente selecionado
      const { data: agentData, error: agentError } = await supabase
        .from('user_selected_agent')
        .select('*')
        .eq('user_id', user.id)
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

  // Salvar dados no Supabase
  const saveToSupabase = async (type: 'profile' | 'agent' | 'plan', data: any) => {
    if (!user) return false;

    try {
      console.log(`Salvando ${type} no Supabase:`, data);

      switch (type) {
        case 'profile':
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: data.full_name,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Erro ao salvar perfil:', profileError);
            return false;
          }
          break;

        case 'agent':
          const { error: agentError } = await supabase
            .from('user_selected_agent')
            .upsert({
              user_id: user.id,
              agent_id: data.agent_id,
              nickname: data.nickname,
              updated_at: new Date().toISOString()
            });

          if (agentError) {
            console.error('Erro ao salvar agente:', agentError);
            return false;
          }
          break;

        case 'plan':
          const { error: planError } = await supabase
            .from('profiles')
            .update({
              plan_name: data.plan_name,
              plan_active: data.plan_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (planError) {
            console.error('Erro ao salvar plano:', planError);
            return false;
          }
          break;
      }

      console.log(`${type} salvo com sucesso no Supabase`);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar ${type}:`, error);
      return false;
    }
  };

  return {
    fetchUserDataFromSupabase,
    saveToSupabase
  };
};
