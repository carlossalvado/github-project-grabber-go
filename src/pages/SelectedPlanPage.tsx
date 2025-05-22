
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SelectedPlanPage = () => {
  const { plans, loading, selectPlan } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // Get the selected plan ID from localStorage
    const planId = localStorage.getItem('selectedPlanId');
    if (!planId) {
      // If no plan was selected, redirect to the plans page
      navigate('/plans');
      return;
    }

    // Find the selected plan in the plans list
    const plan = plans.find(p => p.id === parseInt(planId));
    if (plan) {
      setSelectedPlan(plan);
    } else if (!loading) {
      // If the plan doesn't exist and plans are loaded, redirect to plans page
      toast.error('Plano selecionado não encontrado');
      navigate('/plans');
    }
  }, [plans, loading, user, navigate]);

  const handleConfirmPlan = async () => {
    if (!selectedPlan) {
      toast.error('Nenhum plano selecionado');
      return;
    }

    setProcessingPayment(true);
    try {
      // Proceed with payment
      await selectPlan(selectedPlan.id);
      // Note: The redirect to checkout happens inside selectPlan function
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      setProcessingPayment(false);
    }
  };

  const handleChangePlan = () => {
    navigate('/plans');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-3 w-3 bg-pink-500 rounded-full mx-1"></div>
          <div className="h-3 w-3 bg-pink-500 rounded-full mx-1 mt-1"></div>
          <div className="h-3 w-3 bg-pink-500 rounded-full mx-1 mt-1"></div>
          <p className="text-pink-500 mt-4">Carregando plano...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-sweetheart-bg py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent mb-4">
            Confirmar Seu Plano
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-gray-700">
            Verifique os detalhes do plano selecionado e confirme para continuar.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-pink-400 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedPlan.name}</CardTitle>
              <CardDescription className="text-base">{selectedPlan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-6 text-center">
                {selectedPlan.price === 0
                  ? "Grátis"
                  : `US$${(selectedPlan.price / 100).toFixed(2)}`}
                {selectedPlan.price > 0 && <span className="text-sm font-normal">/mês</span>}
              </div>
              <ul className="space-y-3">
                {selectedPlan.features.text && (
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mensagens de Texto Ilimitadas
                  </li>
                )}
                {selectedPlan.features.audio && (
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mensagens de Áudio
                  </li>
                )}
                {selectedPlan.features.premium && (
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Recursos Premium Exclusivos
                  </li>
                )}
                {selectedPlan.trial_days > 0 && (
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {selectedPlan.trial_days} dias de teste grátis
                  </li>
                )}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                className="w-full bg-gradient-sweet" 
                onClick={handleConfirmPlan}
                disabled={processingPayment}
              >
                {processingPayment ? "Processando..." : "Confirmar e Pagar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleChangePlan}
                disabled={processingPayment}
                className="w-full"
              >
                Escolher Outro Plano
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SelectedPlanPage;
