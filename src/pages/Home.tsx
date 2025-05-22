
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

// Chave para controle de redirecionamento
const REDIRECT_CONTROL_KEY = 'sweet-ai-redirect-control';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { userSubscription, checkSubscriptionStatus, plans, loading: subscriptionLoading } = useSubscription();
  
  // Verificar informações do perfil do usuário ao carregar a página
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Erro ao carregar perfil do usuário:", error);
          return;
        }
        
        console.log("Perfil do usuário:", profileData);
        
        // Se o usuário tem um plano ativo no perfil, mas não tem assinatura carregada
        // fazemos uma verificação de status
        if (profileData.plan_active && !userSubscription) {
          console.log("Perfil indica plano ativo, verificando status da assinatura...");
          await checkSubscriptionStatus();
        }
        
        // Se for detectada inconsistência entre o perfil e a assinatura
        if (userSubscription && userSubscription.plan_name !== profileData.plan_name) {
          console.log("Inconsistência entre perfil e assinatura detectada, atualizando...");
          await checkSubscriptionStatus();
        }
      } catch (err) {
        console.error("Erro ao verificar perfil:", err);
      }
    };
    
    checkUserProfile();
  }, [user]);

  // Verificar se o usuário está voltando de um checkout do Stripe
  useEffect(() => {
    // Verificar se já estamos em um processo de redirecionamento
    const redirectControl = sessionStorage.getItem(REDIRECT_CONTROL_KEY);
    const currentTime = Date.now();
    
    if (redirectControl) {
      const redirectData = JSON.parse(redirectControl);
      
      // Se o redirecionamento foi iniciado há menos de 5 segundos, não fazer nada
      if (currentTime - redirectData.timestamp < 5000) {
        console.log("Processo de redirecionamento já em andamento, ignorando...");
        return;
      } else {
        // Limpar controle antigo
        sessionStorage.removeItem(REDIRECT_CONTROL_KEY);
      }
    }
    
    // Verificar parâmetros de URL
    const params = new URLSearchParams(location.search);
    const checkoutStatus = params.get('checkout');
    
    // Limpar parâmetros da URL para evitar loops
    if (checkoutStatus) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    if (checkoutStatus === 'canceled') {
      toast.error('Checkout cancelado pelo usuário');
      // Se cancelou, verificamos o status da assinatura para garantir consistência
      if (user) {
        // Executar em segundo plano
        setTimeout(() => {
          checkSubscriptionStatus();
        }, 100);
      }
      setTimeout(() => navigate('/'), 1500);
      return;
    }
    
    if (checkoutStatus === 'success' && user) {
      toast.success('Assinatura realizada com sucesso!');
      
      // Registrar início do redirecionamento
      sessionStorage.setItem(REDIRECT_CONTROL_KEY, JSON.stringify({
        destination: '/profile',
        timestamp: currentTime,
        checkout: 'success'
      }));
      
      // Atualizar perfil em segundo plano
      setTimeout(async () => {
        try {
          console.log("Atualizando perfil para status ativo após pagamento bem-sucedido");
          
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              plan_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (profileError) {
            console.error("Erro ao atualizar status do plano no perfil:", profileError);
          } else {
            console.log("Status do plano atualizado para ATIVO no perfil");
          }
          
          // Depois atualizamos o status da assinatura com o Stripe
          await checkSubscriptionStatus();
        } catch (error) {
          console.error("Erro ao atualizar perfil:", error);
        }
      }, 100);
      
      // SOLUÇÃO: Forçar redirecionamento direto do navegador para /profile
      console.log("Forçando redirecionamento para /profile após pagamento bem-sucedido");
      
      // Usar setTimeout para garantir que o toast seja exibido antes do redirecionamento
      setTimeout(() => {
        // Usar window.location.href para forçar um redirecionamento completo
        window.location.href = '/profile';
      }, 500);
      
      return;
    }
    
    // Verificar se estamos carregando dados de autenticação ou assinatura
    if (authLoading || subscriptionLoading) {
      console.log("Aguardando carregamento de dados de autenticação ou assinatura...");
      return;
    }
    
    // Usuário já tem assinatura ativa, redirecionar para o perfil
    if (user && userSubscription && userSubscription.status === 'active') {
      console.log("Usuário com assinatura ativa, redirecionando para /profile");
      navigate('/profile');
      return;
    }
    
    // Recuperar plano selecionado do localStorage, se houver
    const selectedPlanId = localStorage.getItem('selectedPlanId');
    if (selectedPlanId && user) {
      // Usuário está logado e tem um plano selecionado
      const planId = parseInt(selectedPlanId);
      
      // Encontrar o plano pelo ID
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        console.log("Redirecionando para o plano selecionado:", selectedPlan.name);
        
        // Redirecionar para a página específica do plano
        switch (selectedPlan.name) {
          case 'Text Only':
            navigate('/plan/free');
            break;
          case 'Text & Audio':
            navigate('/plan/basic');
            break;
          case 'Premium':
            navigate('/plan/premium');
            break;
          case 'Trial':
            navigate('/plan/ultimate');
            break;
          default:
            navigate(`/plan/${planId}`);
        }
      } else {
        // Plano não encontrado, redirecionar para página inicial
        navigate('/');
      }
    } else if (user) {
      // Usuário logado mas sem plano selecionado
      navigate('/');
    } else {
      // Usuário não está logado, redirecionar para página inicial
      navigate('/');
    }
  }, [user, location, navigate, userSubscription, plans, authLoading, subscriptionLoading]);

  // Loading page while redirecting
  return (
    <div className="min-h-screen bg-sweetheart-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent mb-6">
          Isa date
        </h1>
        
        <div className="my-8 text-center">
          <p className="text-xl mb-4">Obrigado por usar o Isa date</p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
            >
              Ir para a página inicial
            </button>
            {user && (
              <div className="flex justify-center space-x-4 mt-4">
                <button 
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  Ver meu perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
