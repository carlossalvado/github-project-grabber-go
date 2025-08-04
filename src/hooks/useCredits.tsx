import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreditsState {
  credits: number;
  hasCredits: boolean;
  isLoading: boolean;
  initializeCredits: (userId: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
  consumeCredits: (amount: number) => Promise<boolean>;
}

const useCreditsStore = create<CreditsState>((set, get) => ({
  credits: 0,
  hasCredits: false,
  isLoading: true,
  
  initializeCredits: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      const credits = profile?.credits ?? 0;
      set({
        credits,
        hasCredits: credits > 0,
        isLoading: false
      });
    } catch (error) {
      console.error("Erro ao inicializar créditos do usuário:", error);
      set({ isLoading: false });
    }
  },

  refreshCredits: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const credits = profile?.credits ?? 0;
      set({
        credits,
        hasCredits: credits > 0
      });
    } catch (error) {
      console.error("Erro ao atualizar créditos:", error);
    }
  },

  consumeCredits: async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para usar créditos.");
      return false;
    }

    const currentCredits = get().credits;
    if (currentCredits < amount) {
      toast.error("Créditos insuficientes.");
      return false;
    }
    
    set(state => ({
        credits: state.credits - amount,
        hasCredits: (state.credits - amount) > 0,
    }));

    try {
      const { data: success, error } = await supabase.rpc('decrement_user_credits', {
        user_id_param: user.id,
        credits_to_deduct: amount
      });

      if (error || !success) {
        toast.error("Ocorreu um erro ao debitar seus créditos. Tente novamente.");
        console.error("Erro no RPC decrement_user_credits:", error);
        set(state => ({
            credits: state.credits + amount,
            hasCredits: (state.credits + amount) > 0,
        }));
        return false;
      }

      console.log(`Créditos consumidos com sucesso: ${amount}`);
      return true;
    } catch (error) {
      toast.error("Ocorreu um erro de comunicação ao usar seus créditos.");
      console.error("Falha na chamada RPC:", error);
      set(state => ({
        credits: state.credits + amount,
        hasCredits: (state.credits + amount) > 0,
      }));
      return false;
    }
  },
}));

export const useCredits = useCreditsStore;