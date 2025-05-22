import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Local storage key for caching subscription data
const SUBSCRIPTION_CACHE_KEY = 'sweet-ai-subscription-data';
const SUBSCRIPTION_CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 horas (aumentado para maior persistência)
// Chave para armazenar detalhes do plano selecionado
const SELECTED_PLAN_DETAILS_KEY = 'sweet-ai-selected-plan-details';
// Chave para armazenar dados do perfil do usuário
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
    // Default values if structure is unexpected
    return { text: false, audio: false };
  };

  // Save subscription to local storage with timestamp
  const cacheSubscription = (subscription: Subscription | null) => {
    if (subscription) {
      const subscriptionWithTimestamp = {
        ...subscription,
        cached_at: Date.now()
      };
      localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(subscriptionWithTimestamp));
      console.log("Assinatura salva no cache:", subscription.plan_name);
    } else {
      // Não remover do cache se for null, apenas em logout explícito
      console.log("Não atualizando cache de assinatura com valor nulo");
    }
  };

  // Get cached subscription, return null if expired
  const getCachedSubscription = (): Subscription | null => {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;

    try {
      const subscription = JSON.parse(cached) as Subscription;
      const cachedAt = subscription.cached_at || 0;
      if (Date.now() - cachedAt > SUBSCRIPTION_CACHE_EXPIRY) {
        console.log("Cache de assinatura expirado, mas mantendo para consulta");
        // Não remover do cache mesmo se expirado
      }
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
    } else {
      // Não remover do cache se for null, apenas em logout explícito
      console.log("Não atualizando cache de perfil com valor nulo");
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

  // Load all available plans
  useEffect(() => {
    console.log("Loading plans...");
    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price');
        
        if (error) throw error;
        
        if (data) {
          console.log("Plans data received:", data);
          // Transform the features from Json to the expected structure
          const transformedPlans: Plan[] = data.map(plan => ({
            ...plan,
            features: transformFeatures(plan.features as Json)
          }));
          
          console.log("Transformed plans:", transformedPlans);
          setPlans(transformedPlans);
        }
      } catch (error: any) {
        console.error("Error loading plans:", error);
        toast.error("Falha ao carregar os planos de assinatura");
      } finally {
        // Even if there's an error, we should stop loading
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  // Atualizar perfil no Supabase (usado apenas em momentos críticos)
  const updateProfileInSupabase = async (userId: string, planName: string | null, planActive: boolean) => {
    try {
      console.log("Atualizando perfil no Supabase:", planName, planActive);
      const { error } = await supabase
        .from('profiles')
        .update({
          plan_name: planName,
          plan_active: planActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error("Erro ao atualizar perfil no Supabase:", error);
        return false;
      }
      
      // Atualizar cache do perfil
      cacheUserProfile({
        id: userId,
        plan_name: planName,
        plan_active: planActive,
        cached_at: Date.now()
      });
      
      console.log("Perfil atualizado no Supabase e no cache:", planName, planActive);
      return true;
    } catch (err) {
      console.error("Erro ao atualizar perfil no Supabase:", err);
      return false;
    }
  };

  // Ensure profile data is in sync with subscription data
  // Agora usado apenas em momentos críticos (pagamento, login)
  const syncProfileWithSubscription = async (userId: string, subscription: Subscription | null) => {
    try {
      if (!subscription) {
        // Verificar cache do perfil antes de qualquer operação
        const cachedProfile = getCachedUserProfile();
        const selectedPlanDetails = getSelectedPlanDetails();
        
        if (cachedProfile?.plan_active && cachedProfile?.plan_name) {
          console.log("Usando dados do perfil em cache:", cachedProfile.plan_name);
          return; // Não fazer nada se temos dados em cache
        } else if (selectedPlanDetails?.name) {
          console.log("Usando plano do localStorage como fallback:", selectedPlanDetails.name);
          
          // Atualizar cache do perfil
          cacheUserProfile({
            id: userId,
            plan_name: selectedPlanDetails.name,
            plan_active: true,
            cached_at: Date.now()
          });
          
          // Atualizar Supabase apenas se necessário (pagamento, login)
          await updateProfileInSupabase(userId, selectedPlanDetails.name, true);
          return;
        }
        
        // Se chegou aqui, não temos dados em cache nem fallback
        console.log("Sem dados em cache ou fallback, verificando Supabase");
        
        // Verificar Supabase como último recurso
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', userId)
          .single();
        
        if (profileData?.plan_active && profileData?.plan_name) {
          console.log("Dados encontrados no Supabase, atualizando cache:", profileData.plan_name);
          
          // Atualizar cache do perfil
          cacheUserProfile({
            id: userId,
            plan_name: profileData.plan_name,
            plan_active: profileData.plan_active,
            cached_at: Date.now()
          });
          
          return;
        }
        
        // Se não encontrou nada, não fazer nada (não limpar)
        console.log("Nenhum dado encontrado, mantendo estado atual");
        return;
      }

      // Se temos uma assinatura, atualizar cache e Supabase
      console.log("Atualizando perfil com dados de assinatura:", subscription.plan_name);
      
      // Atualizar cache do perfil
      cacheUserProfile({
        id: userId,
        plan_name: subscription.plan_name || null,
        plan_active: subscription.status === 'active',
        cached_at: Date.now()
      });
      
      // Atualizar Supabase
      await updateProfileInSupabase(
        userId, 
        subscription.plan_name || null, 
        subscription.status === 'active'
      );
      
    } catch (err) {
      console.error("Erro ao sincronizar perfil com assinatura:", err);
    }
  };

  // Load user subscription when user is available
  useEffect(() => {
    const loadUserSubscription = async () => {
      if (!user) {
        setUserSubscription(null);
        setLoading(false);
        return;
      }

      try {
        console.log("Loading user subscription for user ID:", user.id);
        
        // Primeiro verificar cache
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
          
          // Buscar detalhes do plano
          const { data: planData } = await supabase
            .from('plans')
            .select('*')
            .eq('name', cachedProfile.plan_name)
            .maybeSingle();
            
          if (planData) {
            const newSubscription: Subscription = {
              id: crypto.randomUUID(),
              user_id: user.id,
              plan_id: planData.id,
              plan_name: cachedProfile.plan_name,
              status: cachedProfile.plan_active ? 'active' : 'inactive',
              start_date: new Date().toISOString(),
              end_date: null,
              plan: {
                ...planData,
                features: transformFeatures(planData.features as Json)
              },
              cached_at: Date.now()
            };
            
            setUserSubscription(newSubscription);
            cacheSubscription(newSubscription);
            setLoading(false);
            return;
          }
        }
        
        // Se não temos dados em cache, buscar do Supabase
        console.log("Sem dados em cache, buscando do Supabase");
        
        // Verificar assinatura no banco de dados
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subError) {
          console.error("Erro ao carregar assinatura:", subError);
        }
        
        // Verificar perfil do usuário também
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Erro ao carregar perfil do usuário:", profileError);
        }
        
        let finalSubscription: Subscription | null = null;
        
        if (subData) {
          // Se temos dados de assinatura, usar esses
          const subscription = subData as any;
          finalSubscription = {
            ...subscription,
            plan_name: subscription.plan_name || subscription.plan?.name,
            plan: subscription.plan ? {
              ...subscription.plan,
              features: transformFeatures(subscription.plan.features as Json)
            } : undefined,
            cached_at: Date.now()
          };
          
          // Atualizar cache
          cacheSubscription(finalSubscription);
          
          // Atualizar cache do perfil
          if (profileData) {
            cacheUserProfile({
              id: user.id,
              plan_name: finalSubscription.plan_name || null,
              plan_active: finalSubscription.status === 'active',
              cached_at: Date.now()
            });
          }
        } else if (profileData && profileData.plan_active && profileData.plan_name) {
          // Se não temos dados de assinatura, mas o perfil indica um plano ativo
          console.log("Usando dados do perfil:", profileData.plan_name);
          
          // Atualizar cache do perfil
          cacheUserProfile({
            id: user.id,
            plan_name: profileData.plan_name,
            plan_active: profileData.plan_active,
            cached_at: Date.now()
          });
          
          // Buscar detalhes do plano
          const { data: planData } = await supabase
            .from('plans')
            .select('*')
            .eq('name', profileData.plan_name)
            .maybeSingle();
            
          if (planData) {
            const newSubscription: Subscription = {
              id: crypto.randomUUID(),
              user_id: user.id,
              plan_id: planData.id,
              plan_name: profileData.plan_name,
              status: 'active',
              start_date: new Date().toISOString(),
              end_date: null,
              plan: {
                ...planData,
                features: transformFeatures(planData.features as Json)
              },
              cached_at: Date.now()
            };
            
            finalSubscription = newSubscription;
            cacheSubscription(newSubscription);
          }
        } else {
          // Não há plano ativo nem no perfil nem nas assinaturas
          console.log("Nenhum plano ativo encontrado");
          
          // Verificar se há plano no localStorage como último recurso
          const selectedPlanDetails = getSelectedPlanDetails();
          if (selectedPlanDetails) {
            console.log("Encontrado plano no localStorage:", selectedPlanDetails.name);
          }
        }
        
        console.log("Final subscription data:", finalSubscription);
        setUserSubscription(finalSubscription);
        
        // Redirecionamento baseado no status da assinatura
        if (finalSubscription && finalSubscription.status === 'active' && window.location.pathname === '/home') {
          console.log("User has active subscription, redirecting to chat");
          setTimeout(() => {
            window.location.href = '/chat';
          }, 1500);
        }
      } catch (error: any) {
        console.error("Error loading subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSubscription();
  }, [user]);

  // Check subscription status with Stripe - usado apenas após pagamento
  const checkSubscriptionStatus = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para verificar seu status de assinatura");
      return;
    }

    try {
      console.log("Checking subscription status with Stripe...");
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      console.log("Subscription status response:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Refresh user subscription data from database after Stripe check
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (subscriptionError) throw subscriptionError;
      
      if (subscriptionData) {
        const subscription = subscriptionData as any;
        const transformedSubscription = {
          ...subscription,
          plan_name: subscription.plan_name || subscription.plan?.name,
          plan: subscription.plan ? {
            ...subscription.plan,
            features: transformFeatures(subscription.plan.features as Json)
          } : undefined,
          cached_at: Date.now()
        };
        
        setUserSubscription(transformedSubscription);
        cacheSubscription(transformedSubscription);
        
        // Atualizar cache do perfil e Supabase
        await syncProfileWithSubscription(user.id, transformedSubscription);
        
        // Se tem uma assinatura ativa e está na página home, redirecionar para o chat
        if (transformedSubscription.status === 'active' && window.location.pathname === '/home') {
          console.log("User has active subscription, redirecting to chat");
          setTimeout(() => {
            window.location.href = '/chat';
          }, 1500);
        }
      } else {
        // Se não encontrou assinatura, verificar cache e fallbacks
        console.log("Nenhuma assinatura encontrada após verificação do Stripe");
        
        // Verificar cache do perfil
        const cachedProfile = getCachedUserProfile();
        if (cachedProfile?.plan_active && cachedProfile?.plan_name) {
          console.log("Mantendo dados do perfil em cache:", cachedProfile.plan_name);
          return;
        }
        
        // Verificar plano selecionado
        const selectedPlanDetails = getSelectedPlanDetails();
        if (selectedPlanDetails) {
          console.log("Usando plano do localStorage como fallback:", selectedPlanDetails.name);
          
          // Atualizar cache do perfil
          cacheUserProfile({
            id: user.id,
            plan_name: selectedPlanDetails.name,
            plan_active: true,
            cached_at: Date.now()
          });
          
          // Atualizar Supabase
          await updateProfileInSupabase(user.id, selectedPlanDetails.name, true);
        }
      }
      
      return data;
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
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
        
        // Atualizar perfil com informação do plano selecionado (será ativado após pagamento)
        // Atualizar cache do perfil
        cacheUserProfile({
          id: user.id,
          plan_name: selectedPlan.name,
          plan_active: false, // Será ativado após pagamento
          cached_at: Date.now()
        });
        
        // Atualizar Supabase
        await updateProfileInSupabase(user.id, selectedPlan.name, false);
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }

      // For free plans or plans without Stripe integration, continue with our existing flow
      console.log("Processing non-Stripe plan selection:", selectedPlan);
      
      // Calculate end date for trial plans
      let endDate = null;
      if (selectedPlan.trial_days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + selectedPlan.trial_days);
        endDate = date.toISOString();
      }

      // Check if user already has a subscription
      if (userSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            plan_name: selectedPlan.name,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: endDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', userSubscription.id);
        
        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            plan_name: selectedPlan.name,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: endDate
          });
        
        if (error) throw error;
      }

      // Fetch updated subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Transform the plan features in the returned subscription
        const subscription = data as any;
        const transformedSubscription: Subscription = {
          ...subscription,
          plan_name: subscription.plan_name || subscription.plan?.name,
          plan: subscription.plan ? {
            ...subscription.plan,
            features: transformFeatures(subscription.plan.features as Json)
          } : undefined,
          cached_at: Date.now()
        };
        
        setUserSubscription(transformedSubscription);
        cacheSubscription(transformedSubscription);
        
        // Atualizar cache do perfil e Supabase
        await syncProfileWithSubscription(user.id, transformedSubscription);
      }
      
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
