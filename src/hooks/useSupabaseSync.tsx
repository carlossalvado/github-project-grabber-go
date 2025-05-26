
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSupabaseSync = () => {
  const { user } = useAuth();

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
              plan_name: data.plan_name || null,
              plan_active: data.plan_active || false,
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
    saveToSupabase
  };
};
