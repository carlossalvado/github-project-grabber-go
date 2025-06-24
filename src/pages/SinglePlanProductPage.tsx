
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const SinglePlanProductPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, selectPlan } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (planId && plans.length > 0) {
      const planIdNum = parseInt(planId);
      const plan = plans.find(p => p.id === planIdNum);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        toast.error('Plano não encontrado');
        navigate('/home');
      }
    }
  }, [planId, plans, navigate]);

  const handleProceedToCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Nenhum plano selecionado');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setLoading(true);
    
    try {
      await selectPlan(selectedPlan.id);
    } catch (error: any) {
      console.error('Erro ao processar checkout:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Carregando plano...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
              Confirme Seu Plano
            </h1>
            <p className="text-gray-600 mt-2">
              Você está prestes a assinar o plano selecionado
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-pink-600">{selectedPlan.name}</CardTitle>
            <CardDescription>{selectedPlan.description}</CardDescription>
            <div className="text-3xl font-bold mt-4">
              {selectedPlan.price === 0 
                ? "Grátis" 
                : `$${(selectedPlan.price / 100).toFixed(2)}/mês`}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Recursos inclusos:</h4>
              <div className="space-y-2">
                {selectedPlan.features.text && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Conversas por texto</span>
                  </div>
                )}
                {selectedPlan.features.audio && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Conversas por áudio</span>
                  </div>
                )}
                {selectedPlan.features.premium && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Recursos premium</span>
                  </div>
                )}
              </div>
            </div>

            {selectedPlan.trial_days > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Período de teste:</strong> {selectedPlan.trial_days} dias grátis
                </p>
              </div>
            )}

            <Button 
              onClick={handleProceedToCheckout}
              className="w-full bg-gradient-sweet text-white py-3 text-lg"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Finalizar Assinatura'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Ao continuar, você concorda com nossos termos de serviço e política de privacidade.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SinglePlanProductPage;
