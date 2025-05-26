
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useUserCache } from "@/hooks/useUserCache";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export type Plan = {
  id: number;
  name: string;
  description: string;
  price: number;
  features: {
    text: boolean;
    audio: boolean;
    premium?: boolean;
  };
  trial_days: number;
  stripe_price_id?: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: number;
  plan_name?: string;
  status: string;
  start_date: string;
  end_date: string | null;
  plan?: Plan;
};

type SubscriptionContextType = {
  plans: Plan[];
  userSubscription: Subscription | null;
  loading: boolean;
  selectPlan: (planId: number) => Promise<void>;
  checkSubscriptionStatus: () => Promise<any>;
  openCustomerPortal: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { plan, savePlan } = useUserCache();
  const { saveToSupabase } = useSupabaseSync();

  // Helper function to transform features
  const transformFeatures = (features: Json): { text: boolean; audio: boolean; premium?: boolean } => {
    if (typeof features === 'object' && features !== null && !Array.isArray(features)) {
      const featureObj = features as Record<string, unknown>;
      return {
        text: Boolean(featureObj.text),
        audio: Boolean(featureObj.audio),
        premium: featureObj.premium !== undefined ? Boolean(featureObj.premium) : undefined
      };
    }
    return { text: false, audio: false };
  };

  // Load all available plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        console.log("Carregando planos do Supabase...");
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price');
        
        if (error) throw error;
        
        if (data) {
          const transformedPlans: Plan[] = data.map(plan => ({
            ...plan,
            features: transformFeatures(plan.features as Json)
          }));
          
          setPlans(transformedPlans);
          console.log("Planos carregados:", transformedPlans);
        }
      } catch (error: any) {
        console.error("Error loading plans:", error);
        toast.error("Falha ao carregar os planos de assinatura");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  // Criar subscription baseada no cache do plano
  useEffect(() => {
    if (plan && plans.length > 0) {
      const planData = plans.find(p => p.name === plan.plan_name);
      if (planData && plan.plan_active) {
        const subscription: Subscription = {
          id: crypto.randomUUID(),
          user_id: user?.id || '',
          plan_id: planData.id,
          plan_name: plan.plan_name,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: null,
          plan: planData
        };
        setUserSubscription(subscription);
        console.log("Subscription criada do cache:", subscription);
      }
    }
  }, [plan, plans, user]);

  // Check subscription status with Stripe
  const checkSubscriptionStatus = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para verificar seu status de assinatura");
      return null;
    }

    try {
      console.log("Verificando status no Stripe...");
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("Error calling check-subscription:", error);
        throw error;
      }
      
      console.log("Resposta do Stripe:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Se pagamento confirmado, salvar no cache e Supabase
      if (data.hasActiveSubscription && data.planName && data.paymentConfirmed) {
        console.log("Pagamento confirmado! Salvando dados...");
        
        // Salvar no cache
        savePlan({
          plan_name: data.planName,
          plan_active: true
        });
        
        // Salvar no Supabase
        await saveToSupabase('plan', {
          plan_name: data.planName,
          plan_active: true
        });
        
        toast.success(`Pagamento confirmado! Plano ${data.planName} ativado!`);
      }
      
      return data;
    } catch (error: any) {
      console.error("Erro ao verificar status:", error);
      toast.error("Falha ao verificar status da assinatura");
      return null;
    }
  };

  const selectPlan = async (planId: number) => {
    if (!user) {
      toast.error("Você precisa estar logado para selecionar um plano");
      return;
    }

    try {
      const selectedPlan = plans.find(plan => plan.id === planId);
      if (!selectedPlan) {
        throw new Error("Plano não encontrado");
      }

      // Se tem Stripe price ID, criar checkout session
      if (selectedPlan.stripe_price_id) {
        console.log("Criando checkout Stripe para:", selectedPlan);
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId: selectedPlan.id }
        });
        
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        
        console.log("Redirecionando para checkout:", data.url);
        window.location.href = data.url;
        return;
      }

      // Para planos gratuitos, ativar diretamente
      console.log("Ativando plano gratuito:", selectedPlan);
      
      // Salvar no cache
      savePlan({
        plan_name: selectedPlan.name,
        plan_active: true
      });
      
      // Salvar no Supabase
      await saveToSupabase('plan', {
        plan_name: selectedPlan.name,
        plan_active: true
      });
      
      toast.success(`Plano ${selectedPlan.name} ativado com sucesso!`);
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      toast.error(error.message || "Falha ao selecionar o plano");
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para gerenciar sua assinatura");
      return;
    }
    try {
      console.log("Abrindo portal do cliente...");
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast.error("Falha ao abrir o portal de gerenciamento");
    }
  };

  return (
    <SubscriptionContext.Provider value={{ 
      plans, 
      userSubscription, 
      loading, 
      selectPlan, 
      checkSubscriptionStatus, 
      openCustomerPortal 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
