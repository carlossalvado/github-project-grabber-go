
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plan } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SinglePlanCardProps {
  plan: Plan;
  onSelectPlan: (planId: number) => Promise<void>;
}

const SinglePlanCard = ({ plan, onSelectPlan }: SinglePlanCardProps) => {
  const [processing, setProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verificar se o pagamento foi confirmado ao carregar o componente
  useEffect(() => {
    // Verificar no cache do navegador se o plano está ativo
    const checkPaymentStatus = () => {
      // Verificar se há informações de assinatura no localStorage
      const cachedSubscription = localStorage.getItem('sweet-ai-subscription-data');
      const cachedProfile = localStorage.getItem('sweet-ai-user-profile');
      
      if (cachedSubscription) {
        try {
          const subscription = JSON.parse(cachedSubscription);
          // Verificar se a assinatura está ativa e corresponde ao plano atual
          if (subscription.status === 'active' && 
              (subscription.plan_id === plan.id || subscription.plan?.id === plan.id)) {
            console.log('Assinatura ativa encontrada no cache:', subscription);
            setPaymentConfirmed(true);
            return true;
          }
        } catch (error) {
          console.error('Erro ao analisar dados de assinatura do cache:', error);
        }
      }
      
      // Verificar no perfil do usuário se o plano está ativo
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          if (profile.plan_active && profile.plan_name === plan.name) {
            console.log('Plano ativo encontrado no perfil em cache:', profile);
            setPaymentConfirmed(true);
            return true;
          }
        } catch (error) {
          console.error('Erro ao analisar dados de perfil do cache:', error);
        }
      }
      
      // Verificar parâmetros de URL para checkout bem-sucedido
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');
      
      if (checkoutStatus === 'success') {
        console.log('Parâmetro de checkout=success detectado na URL');
        // Limpar parâmetros da URL para evitar processamento duplicado
        window.history.replaceState({}, document.title, window.location.pathname);
        setPaymentConfirmed(true);
        return true;
      }
      
      return false;
    };
    
    const isPaymentConfirmed = checkPaymentStatus();
    console.log('Status de pagamento confirmado:', isPaymentConfirmed);
  }, [plan.id, plan.name]);

  const handleSelectPlan = async () => {
    try {
      console.log("Selecionando plano:", plan.name, "com ID:", plan.id);
      localStorage.setItem('selectedPlanId', plan.id.toString());
      
      setProcessing(true);
      
      // Se o usuário não estiver logado, envie-o para a página de cadastro
      if (!user) {
        navigate('/signup');
        return;
      }
      
      // Inicie o checkout do Stripe
      await initiateCheckout();
      
    } catch (error) {
      console.error("Error selecting plan:", error);
      toast.error("Erro ao selecionar o plano. Tente novamente.");
      setProcessing(false);
    }
  };
  
  const initiateCheckout = async () => {
    try {
      setIsCheckingOut(true);
      console.log("Iniciando checkout do Stripe para o plano:", plan.name);
      
      await onSelectPlan(plan.id);
      // O redirecionamento para o Stripe será feito pela função onSelectPlan
      // que chama a função do Supabase e faz o redirecionamento
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      toast.error("Falha ao iniciar o checkout. Por favor, tente novamente.");
      setIsCheckingOut(false);
      setProcessing(false);
    }
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent mb-4">
            {paymentConfirmed ? 'Pagamento Confirmado!' : 'Seu Plano Selecionado'}
          </h1>
          <p className="text-lg text-gray-700">
            {paymentConfirmed 
              ? 'Seu pagamento foi processado com sucesso. Você já pode acessar seu perfil.'
              : 'Confirme os detalhes e continue para finalizar.'}
          </p>
        </div>
        <Card className={`relative overflow-hidden hover:shadow-lg transition-shadow duration-300 ${plan.id === 3 ? 'border-2 border-pink-400' : ''}`}>
          {plan.id === 3 && (
            <div className="absolute top-0 right-0 bg-gradient-sweet text-white px-3 py-1 text-sm font-bold">
              Mais Popular
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription className="text-base">{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6 text-center">
              {plan.price === 0
                ? "Grátis"
                : ` US$${(plan.price / 100).toFixed(2)}`}
              {plan.price > 0 && <span className="text-sm font-normal">/mês</span>}
            </div>
            <ul className="space-y-3">
              {plan.features.text && (
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mensagens de Texto Ilimitadas
                </li>
              )}
              {plan.features.audio && (
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mensagens de Áudio
                </li>
              )}
              {plan.features.premium && (
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Recursos Premium Exclusivos
                </li>
              )}
              {plan.trial_days > 0 && (
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.trial_days} dias de teste grátis
                </li>
              )}
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {paymentConfirmed ? (
              // Mostrar apenas o botão para ir ao perfil quando o pagamento for confirmado
              <Button 
                className="w-full bg-gradient-sweet" 
                onClick={handleGoToProfile}
              >
                Ir para Meu Perfil
              </Button>
            ) : (
              // Mostrar os botões normais quando o pagamento não for confirmado
              <>
                <Button 
                  className="w-full bg-gradient-sweet" 
                  onClick={handleSelectPlan}
                  disabled={processing || isCheckingOut}
                >
                  {isCheckingOut ? "Carregando checkout..." : 
                   processing ? "Processando..." : "Confirmar e Continuar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  disabled={processing || isCheckingOut}
                  className="w-full"
                >
                  Voltar para a Página Inicial
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SinglePlanCard;
