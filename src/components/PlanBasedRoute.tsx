
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialManager } from '@/hooks/useTrialManager';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlanBasedRouteProps {
  children: React.ReactNode;
  requiredPlan: string;
}

const PlanBasedRoute: React.FC<PlanBasedRouteProps> = ({ children, requiredPlan }) => {
  const { user, loading: authLoading } = useAuth();
  const { isTrialActive, loading: trialLoading } = useTrialManager();
  const [planData, setPlanData] = useState<{
    planName: string | null;
    planActive: boolean;
    loading: boolean;
  }>({
    planName: null,
    planActive: false,
    loading: true
  });

  console.log('PlanBasedRoute - Dados iniciais:', {
    requiredPlan,
    user: !!user,
    authLoading,
    trialLoading,
    isTrialActive
  });

  // Buscar dados do plano diretamente do Supabase
  useEffect(() => {
    const fetchPlanData = async () => {
      if (!user) {
        setPlanData({ planName: null, planActive: false, loading: false });
        return;
      }

      try {
        console.log('PlanBasedRoute - Buscando dados do perfil do usuário...');
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('PlanBasedRoute - Erro ao buscar perfil:', error);
          setPlanData({ planName: null, planActive: false, loading: false });
          return;
        }

        console.log('PlanBasedRoute - Dados do perfil encontrados:', profile);
        
        setPlanData({
          planName: profile?.plan_name || null,
          planActive: profile?.plan_active || false,
          loading: false
        });
        
      } catch (error) {
        console.error('PlanBasedRoute - Erro na busca:', error);
        setPlanData({ planName: null, planActive: false, loading: false });
      }
    };

    if (user && !trialLoading) {
      fetchPlanData();
    }
  }, [user, trialLoading]);

  if (authLoading || trialLoading || planData.loading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('PlanBasedRoute - Usuário não logado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Para chat-trial: verificar se o trial está ativo
  if (requiredPlan === 'trial') {
    console.log('PlanBasedRoute - Verificando acesso ao trial:', { isTrialActive });
    if (isTrialActive) {
      console.log('PlanBasedRoute - Trial ativo, permitindo acesso');
      return <>{children}</>;
    } else {
      console.log('PlanBasedRoute - Trial inativo, redirecionando para profile');
      return <Navigate to="/profile" replace />;
    }
  }

  // Para outros chats: verificar plano ativo
  console.log('PlanBasedRoute - Verificando plano:', { 
    planName: planData.planName, 
    planActive: planData.planActive,
    requiredPlan 
  });

  if (!planData.planActive || !planData.planName) {
    console.log('PlanBasedRoute - Plano inativo ou inexistente, redirecionando para profile');
    return <Navigate to="/profile" replace />;
  }

  // Mapear planos para suas páginas de chat correspondentes
  const planToChatMap: { [key: string]: string } = {
    'Text & Audio': 'text-audio',
    'Text Only': 'text-only',
    'Premium': 'premium',
    'Ultimate': 'ultimate'
  };

  const userChatType = planToChatMap[planData.planName];
  
  console.log('PlanBasedRoute - Mapeamento:', { 
    planName: planData.planName, 
    userChatType, 
    requiredPlan,
    hasAccess: userChatType === requiredPlan
  });
  
  // Se o usuário tem o plano correto para esta página, permitir acesso
  if (userChatType === requiredPlan) {
    console.log('PlanBasedRoute - Acesso permitido!');
    return <>{children}</>;
  }

  // Se não tem o plano correto, redirecionar para profile
  console.log('PlanBasedRoute - Plano incompatível, redirecionando para profile');
  return <Navigate to="/profile" replace />;
};

export default PlanBasedRoute;
