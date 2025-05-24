import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Local storage keys for caching
const SUBSCRIPTION_CACHE_KEY = 'sweet-ai-subscription-data';
const PLANS_CACHE_KEY = 'sweet-ai-plans-data';
const SUBSCRIPTION_CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 horas
const SELECTED_PLAN_DETAILS_KEY = 'sweet-ai-selected-plan-details';
const USER_PROFILE_CACHE_KEY = 'sweet-ai-user-profile';

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
  cached_at?: number;
};

type UserProfile = {
  id: string;
  plan_name: string | null;
  plan_active: boolean;
  cached_at: number;
};

type SubscriptionContextType = {
  plans: Plan[];
  userSubscription: Subscription | null;
  loading: boolean;
  selectPlan: (planId: number) => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  // Cache functions
  const cachePlans = (plansData: Plan[]) => {
    const cacheData = {
      plans: plansData,
      cached_at: Date.now()
    };
    localStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(cacheData));
    console.log("Planos salvos no cache:", plansData.length, "planos");
  };

  const getCachedPlans = (): Plan[] | null => {
    const cached = localStorage.getItem(PLANS_CACHE_KEY);
    if (!cached) return null;

    try {
      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.cached_at > SUBSCRIPTION_CACHE_EXPIRY;
      
      if (isExpired) {
        localStorage.removeItem(PLANS_CACHE_KEY);
        return null;
      }
      
      return cacheData.plans;
    } catch (e) {
      console.error("Erro ao ler cache de planos:", e);
      localStorage.removeItem(PLANS_CACHE_KEY);
      return null;
    }
  };

  // Salvar dados de assinatura no cache com timestamp
  const cacheSubscription = (subscription: Subscription | null) => {
    if (subscription) {
      const subscriptionWithTimestamp = {
        ...subscription,
        cached_at: Date.now()
      };
      localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(subscriptionWithTimestamp));
      console.log("Assinatura salva no cache:", subscription.plan_name, subscription.status);
    }
  };

  // Obter assinatura do cache
  const getCachedSubscription = (): Subscription | null => {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;

    try {
      const subscription = JSON.parse(cached) as Subscription;
      return subscription;
    } catch (e) {
      console.error("Erro ao ler cache de assinatura:", e);
      return null;
    }
  };

  // Salvar perfil do usuário no cache
  const cacheUserProfile = (profile: UserProfile | null) => {
    if (profile) {
      const profileWithTimestamp = {
        ...profile,
        cached_at: Date.now()
      };
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profileWithTimestamp));
      console.log("Perfil do usuário salvo no cache:", profile.plan_name, profile.plan_active);
    }
  };

  // Obter perfil do usuário do cache
  const getCachedUserProfile = (): UserProfile | null => {
    const cached = localStorage.getItem(USER_PROFILE_CACHE_KEY);
    if (!cached) return null;

    try {
      const profile = JSON.parse(cached) as UserProfile;
      return profile;
    } catch (e) {
      console.error("Erro ao ler cache de perfil:", e);
      return null;
    }
  };

  // Salvar detalhes do plano selecionado no localStorage
  const saveSelectedPlanDetails = (plan: Plan) => {
    localStorage.setItem(SELECTED_PLAN_DETAILS_KEY, JSON.stringify({
      id: plan.id,
      name: plan.name,
      features: plan.features,
      timestamp: Date.now()
    }));
    console.log("Detalhes do plano selecionado salvos no cache:", plan.name);
  };

  // Obter detalhes do plano selecionado do localStorage
  const getSelectedPlanDetails = () => {
    const cached = localStorage.getItem(SELECTED_PLAN_DETAILS_KEY);
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Erro ao ler cache de detalhes do plano:", e);
      return null;
    }
  };

  // Load all available plans with cache
  useEffect(() => {
    const loadPlans = async () => {
      console.log("Loading plans...");
      
      // Tentar carregar do cache primeiro
      const cachedPlans = getCachedPlans();
      if (cachedPlans) {
        console.log("Usando planos do cache:", cachedPlans.length, "planos");
        setPlans(cachedPlans);
        setLoading(false);
        return;
      }

      try {
        console.log("Carregando planos do Supabase...");
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price');
        
        if (error) throw error;
        
        if (data) {
          console.log("Plans data received from Supabase:", data);
          const transformedPlans: Plan[] = data.map(plan => ({
            ...plan,
            features: transformFeatures(plan.features as Json)
          }));
          
          console.log("Transformed plans:", transformedPlans);
          setPlans(transformedPlans);
          cachePlans(transformedPlans);
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

  // Load user subscription - APENAS DO CACHE, NÃO DO SUPABASE
  useEffect(() => {
    const loadUserSubscription = async () => {
      if (!user) {
        setUserSubscription(null);
        setLoading(false);
        return;
      }

      try {
        console.log("Carregando assinatura do usuário APENAS DO CACHE para:", user.id);
        
        // Verificar APENAS cache - não consultar Supabase
        const cachedSubscription = getCachedSubscription();
        const cachedProfile = getCachedUserProfile();
        
        if (cachedSubscription) {
          console.log("Usando assinatura em cache:", cachedSubscription.plan_name);
          setUserSubscription(cachedSubscription);
          setLoading(false);
          return;
        }
        
        if (cachedProfile?.plan_active && cachedProfile?.plan_name) {
          console.log("Usando perfil em cache:", cachedProfile.plan_name);
          
          // Buscar detalhes do plano dos dados já carregados
          const planData = plans.find(p => p.name === cachedProfile.plan_name);
            
          if (planData) {
            const newSubscription: Subscription = {
              id: crypto.randomUUID(),
              user_id: user.id,
              plan_id: planData.id,
              plan_name: cachedProfile.plan_name,
              status: cachedProfile.plan_active ? 'active' : 'inactive',
              start_date: new Date().toISOString(),
              end_date: null,
              plan: planData,
              cached_at: Date.now()
            };
            
            setUserSubscription(newSubscription);
            cacheSubscription(newSubscription);
            setLoading(false);
            return;
          }
        }
        
        // Se não há dados em cache, deixar vazio (não consultar Supabase)
        console.log("Nenhum dado de assinatura encontrado no cache");
        setUserSubscription(null);
        
      } catch (error: any) {
        console.error("Error loading subscription from cache:", error);
      } finally {
        setLoading(false);
      }
    };

    // Aguardar os planos serem carregados antes de carregar a assinatura
    if (plans.length > 0) {
      loadUserSubscription();
    }
  }, [user, plans]);

  // Check subscription status with Stripe - APENAS PARA CONFIRMAÇÃO DE PAGAMENTO
  const checkSubscriptionStatus = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para verificar seu status de assinatura");
      return;
    }

    try {
      console.log("Verificando status de assinatura APÓS PAGAMENTO...");
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      console.log("Resposta de verificação de assinatura:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Se o pagamento foi confirmado (hasActiveSubscription = true)
      if (data.hasActiveSubscription && data.planName) {
        console.log("PAGAMENTO CONFIRMADO! Salvando no cache...");
        
        // CRITICAL FIX: Ensure we explictly set plan_active to true in the cache
        const isActive = data.planActive !== undefined ? data.planActive : true;
        
        // Buscar detalhes do plano dos dados já carregados
        const selectedPlan = plans.find(p => p.name === data.planName);
        
        if (selectedPlan) {
          const confirmedSubscription: Subscription = {
            id: crypto.randomUUID(),
            user_id: user.id,
            plan_id: selectedPlan.id,
            plan_name: data.planName,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: data.periodEnd || null,
            plan: selectedPlan,
            cached_at: Date.now()
          };
          
          // Atualizar estado e cache
          setUserSubscription(confirmedSubscription);
          cacheSubscription(confirmedSubscription);
          
          // Atualizar cache do perfil - CRITICAL FIX: Always set plan_active to true
          cacheUserProfile({
            id: user.id,
            plan_name: data.planName,
            plan_active: true, // Explicitly TRUE
            cached_at: Date.now()
          });
          
          console.log("Dados de assinatura ATIVA salvos no cache após confirmação:", confirmedSubscription);
          toast.success(`Pagamento confirmado! Plano ${data.planName} ativado com sucesso!`);
        }
      } else {
        console.log("Nenhuma assinatura ativa encontrada após verificação");
      }
      
      return data;
    } catch (error: any) {
      console.error("Erro ao verificar status da assinatura:", error);
      toast.error("Falha ao verificar status da assinatura");
    }
  };

  const selectPlan = async (planId: number) => {
    if (!user) {
      toast.error("Você precisa estar logado para selecionar um plano");
      return;
    }

    try {
      // Find the selected plan
      const selectedPlan = plans.find(plan => plan.id === planId);
      if (!selectedPlan) {
        throw new Error("Plano não encontrado");
      }

      // Salvar detalhes do plano no localStorage para uso como fallback
      saveSelectedPlanDetails(selectedPlan);

      // If plan has a Stripe price ID, create a checkout session
      if (selectedPlan.stripe_price_id) {
        console.log("Creating Stripe checkout for plan:", selectedPlan);
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId: selectedPlan.id }
        });
        
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        
        console.log("Checkout session created:", data);
        
        // Atualizar cache com informação do plano selecionado (será ativado após pagamento)
        cacheUserProfile({
          id: user.id,
          plan_name: selectedPlan.name,
          plan_active: false, // Será ativado após pagamento
          cached_at: Date.now()
        });
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }

      // For free plans or plans without Stripe integration
      console.log("Processing non-Stripe plan selection:", selectedPlan);
      
      // Para planos gratuitos, ativar diretamente no cache
      const freeSubscription: Subscription = {
        id: crypto.randomUUID(),
        user_id: user.id,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: selectedPlan.trial_days > 0 ? new Date(Date.now() + selectedPlan.trial_days * 24 * 60 * 60 * 1000).toISOString() : null,
        plan: selectedPlan,
        cached_at: Date.now()
      };
      
      setUserSubscription(freeSubscription);
      cacheSubscription(freeSubscription);
      
      // Atualizar cache do perfil
      cacheUserProfile({
        id: user.id,
        plan_name: selectedPlan.name,
        plan_active: true,
        cached_at: Date.now()
      });
      
      toast.success(`Você assinou o plano ${selectedPlan.name} com sucesso!`);
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
      console.log("Opening Stripe customer portal...");
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      console.log("Customer portal session created:", data);
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast.error("Falha ao abrir o portal de gerenciamento de assinatura");
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
