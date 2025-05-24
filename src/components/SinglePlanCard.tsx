
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plan } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Check } from 'lucide-react';

interface SinglePlanCardProps {
  plan: Plan;
  onSelectPlan: (planId: number) => Promise<void>;
}

const SinglePlanCard = ({ plan, onSelectPlan }: SinglePlanCardProps) => {
  const [processing, setProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkSubscriptionStatus } = useSubscription();

  // Verificar se o pagamento foi confirmado ao carregar o componente
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Verificar parâmetros de URL para checkout bem-sucedido
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');
      
      if (checkoutStatus === 'success') {
        console.log('Parâmetro de checkout=success detectado na URL');
        setVerifyingPayment(true);
        
        try {
          // Verificar status da assinatura no Stripe e atualizar dados
          await checkSubscriptionStatus();
          setPaymentConfirmed(true);
          toast.success('Pagamento confirmado com sucesso!');
        } catch (error) {
          console.error('Erro ao verificar status de pagamento:', error);
          toast.error('Erro ao confirmar pagamento. Tente novamente.');
        } finally {
          setVerifyingPayment(false);
        }
        
        // Limpar parâmetros da URL para evitar processamento duplicado
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
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
            return;
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
            return;
          }
        } catch (error) {
          console.error('Erro ao analisar dados de perfil do cache:', error);
        }
      }
    };
    
    checkPaymentStatus();
  }, [plan.id, plan.name, checkSubscriptionStatus]);

  const handleSelectPlan = async () => {
    setProcessing(true);
    try {
      console.log("Selecionando plano:", plan.name, "com ID:", plan.id);
      localStorage.setItem('selectedPlanId', plan.id.toString());
      
      // Iniciar o checkout com o Stripe
      await onSelectPlan(plan.id);
    } catch (error) {
      console.error("Error selecting plan:", error);
      toast.error("Erro ao selecionar o plano. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (verifyingPayment) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
        
        {/* Background Images */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full overflow-hidden opacity-10 animate-pulse">
          <img 
            src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="max-w-md w-full relative z-10">
          <Card className="text-center p-8 bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-pink-500 rounded-full mb-4"></div>
              <h2 className="text-xl font-bold mb-2 text-white">Verificando Pagamento...</h2>
              <p className="text-slate-400">Aguarde enquanto confirmamos seu pagamento.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Background Images */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full overflow-hidden opacity-10 animate-pulse">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-10 right-10 w-36 h-36 rounded-full overflow-hidden opacity-15 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/2 right-20 w-28 h-28 rounded-full overflow-hidden opacity-10 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-500 mb-4">
            {paymentConfirmed ? 'Pagamento Confirmado!' : 'Seu Plano Selecionado'}
          </h1>
          <p className="text-lg text-white">
            {paymentConfirmed 
              ? 'Seu pagamento foi processado com sucesso. Você já pode começar a conversar!'
              : 'Confirme os detalhes e continue para finalizar.'}
          </p>
        </div>
        <Card className={`relative overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-slate-800/80 backdrop-blur-sm border-slate-700 ${plan.id === 3 ? 'border-2 border-pink-400' : ''}`}>
          {plan.id === 3 && (
            <div className="absolute top-0 right-0 bg-pink-500 text-white px-3 py-1 text-sm font-bold">
              Mais Popular
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
            <CardDescription className="text-base text-slate-400">{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6 text-center text-pink-500">
              {plan.price === 0
                ? "Grátis"
                : `US$${(plan.price / 100).toFixed(2)}`}
              {plan.price > 0 && <span className="text-sm font-normal text-white">/mês</span>}
            </div>
            <ul className="space-y-3">
              {plan.features.text && (
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-pink-500 mr-2" />
                  <span className="text-white">Mensagens de Texto Ilimitadas</span>
                </li>
              )}
              {plan.features.audio && (
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-pink-500 mr-2" />
                  <span className="text-white">Mensagens de Áudio</span>
                </li>
              )}
              {plan.features.premium && (
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-pink-500 mr-2" />
                  <span className="text-white">Recursos Premium Exclusivos</span>
                </li>
              )}
              {plan.trial_days > 0 && (
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-pink-500 mr-2" />
                  <span className="text-white">{plan.trial_days} dias de teste grátis</span>
                </li>
              )}
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {paymentConfirmed ? (
              // Mostrar botões para usuários com pagamento confirmado
              <>
                <Button 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                  onClick={() => navigate('/modern-chat')}
                >
                  Começar a Conversar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                  className="w-full border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                >
                  Ver Meu Perfil
                </Button>
              </>
            ) : (
              // Mostrar os botões normais quando o pagamento não for confirmado
              <>
                <Button 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                  onClick={handleSelectPlan}
                  disabled={processing}
                >
                  {processing ? "Processando..." : "Confirmar e Continuar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  disabled={processing}
                  className="w-full border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
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
