
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useUserCache } from "@/hooks/useUserCache";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

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
  verifyPaymentSuccess: (redirectUrl?: string) => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { plan, savePlan, updatePlanAfterPayment } = useUserCache();
  const { saveToSupabase } = useSupabaseSync();
  const navigate = useNavigate();

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
    if (plan && plans.length > 0 && user) {
      console.log("Verificando plano no cache:", plan);
      
      const planData = plans.find(p => p.name === plan.plan_name);
      if (planData && plan.plan_active) {
        const subscription: Subscription = {
          id: crypto.randomUUID(),
          user_id: user.id,
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

  // Verificar URL em busca de parâmetros de checkout
  useEffect(() => {
    const checkUrlForPaymentSuccess = async () => {
      if (!user) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');
      
      if (checkoutStatus === 'success') {
        console.log('🎉 Checkout success detectado, verificando pagamento...');
        await verifyPaymentSuccess();
        
        // Limpar URL independentemente do resultado
        navigate(window.location.pathname, { replace: true });
      }
    };
    
    checkUrlForPaymentSuccess();
  }, [user, navigate]);

  // Função para dar créditos baseado no plano
  const givePlanCredits = async (planName: string) => {
    if (!user) return false;

    try {
      console.log(`🎁 Dando créditos do plano ${planName} para o usuário`);
      const { data, error } = await supabase.rpc('give_plan_credits', {
        user_uuid: user.id,
        plan_name_param: planName
      });

      if (error) {
        console.error('Erro ao dar créditos do plano:', error);
        return false;
      }

      console.log(`✅ Créditos do plano ${planName} dados com sucesso!`);
      return data;
    } catch (error) {
      console.error('Erro ao dar créditos do plano:', error);
      return false;
    }
  };

  // Nova função para verificar o sucesso do pagamento
  const verifyPaymentSuccess = async (redirectUrl?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Você precisa estar logado para verificar seu pagamento");
      return false;
    }

    try {
      console.log("🔍 Verificando status do pagamento...");
      toast.loading("Verificando seu pagamento...");
      
      // Primeira tentativa
      const result = await checkSubscriptionStatus();
      
      if (result?.paymentConfirmed && result?.planActive === true) {
        console.log('✅ PAGAMENTO CONFIRMADO!');
        
        // SALVAR NO CACHE IMEDIATAMENTE
        const planData = updatePlanAfterPayment(result.planName, true);
        console.log('💾 Dados salvos no cache após pagamento:', planData);

        // DAR CRÉDITOS BASEADO NO PLANO
        await givePlanCredits(result.planName);
        
        // CRIAR SUBSCRIPTION LOCAL
        const planDetails = plans.find(p => p.name === result.planName);
        if (planDetails) {
          const subscription: Subscription = {
            id: crypto.randomUUID(),
            user_id: user.id,
            plan_id: planDetails.id,
            plan_name: result.planName,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null,
            plan: planDetails
          };
          setUserSubscription(subscription);
          console.log('💾 Subscription local criada:', subscription);
        }
        
        toast.dismiss();
        toast.success('🎉 Pagamento confirmado com sucesso!');
        
        if (redirectUrl) {
          navigate(redirectUrl);
        }
        
        return true;
      } 
      
      // Segunda tentativa após aguardar um pouco
      console.log('⚠️ Pagamento ainda não confirmado, tentando novamente...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const secondResult = await checkSubscriptionStatus();
      
      if (secondResult?.paymentConfirmed && secondResult?.planActive === true) {
        console.log('✅ PAGAMENTO CONFIRMADO na segunda tentativa!');
        
        // SALVAR NO CACHE IMEDIATAMENTE
        const planData = updatePlanAfterPayment(secondResult.planName, true);
        console.log('💾 Dados salvos no cache após pagamento (2ª tentativa):', planData);

        // DAR CRÉDITOS BASEADO NO PLANO
        await givePlanCredits(secondResult.planName);
        
        // CRIAR SUBSCRIPTION LOCAL
        const planDetails = plans.find(p => p.name === secondResult.planName);
        if (planDetails) {
          const subscription: Subscription = {
            id: crypto.randomUUID(),
            user_id: user.id,
            plan_id: planDetails.id,
            plan_name: secondResult.planName,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null,
            plan: planDetails
          };
          setUserSubscription(subscription);
          console.log('💾 Subscription local criada (2ª tentativa):', subscription);
        }
        
        toast.dismiss();
        toast.success('🎉 Pagamento confirmado com sucesso!');
        
        if (redirectUrl) {
          navigate(redirectUrl);
        }
        
        return true;
      }
      
      // Se chegou aqui, não conseguiu confirmar
      console.error('❌ Não foi possível confirmar o pagamento após múltiplas tentativas');
      toast.dismiss();
      toast.error('Não conseguimos confirmar seu pagamento. Recarregue a página ou tente novamente.');
      return false;
      
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      toast.dismiss();
      toast.error('Erro ao verificar pagamento.');
      return false;
    }
  };

  // Check subscription status with Stripe
  const checkSubscriptionStatus = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para verificar seu status de assinatura");
      return null;
    }

    try {
      console.log("🔍 Verificando status no Stripe...");
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("Error calling check-subscription:", error);
        throw error;
      }
      
      console.log("📧 Resposta do Stripe:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error: any) {
      console.error("❌ Erro ao verificar status:", error);
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
        console.log("💳 Criando checkout Stripe para:", selectedPlan);
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId: selectedPlan.id }
        });
        
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        
        console.log("🔗 Redirecionando para checkout:", data.url);
        window.location.href = data.url;
        return;
      }

      // Para planos gratuitos, ativar diretamente
      console.log("🆓 Ativando plano gratuito:", selectedPlan);
      
      const planData = {
        plan_name: selectedPlan.name,
        plan_active: true
      };
      
      // Salvar no cache PRIMEIRO
      savePlan(planData);
      
      // Depois salvar no Supabase
      await saveToSupabase('plan', planData);

      // Dar créditos baseado no plano
      await givePlanCredits(selectedPlan.name);
      
      toast.success(`✅ Plano ${selectedPlan.name} ativado com sucesso!`);
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
      verifyPaymentSuccess,
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
