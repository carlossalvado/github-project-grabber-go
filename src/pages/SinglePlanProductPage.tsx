import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SinglePlanProductPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, selectPlan } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const UPGRADE_COST = 20;

  const [userCredits, setUserCredits] = useState(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const fetchUserCredits = async () => {
        setIsLoadingCredits(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();
          
          if (error) {
            if (error.code !== 'PGRST116') {
              throw error;
            }
          }
          
          setUserCredits(data?.credits || 0);

        } catch (error: any) {
          console.error("Erro ao carregar os créditos do perfil:", error);
          toast.error("Não foi possível carregar seu saldo de créditos.");
          setUserCredits(0);
        } finally {
          setIsLoadingCredits(false);
        }
      };

      fetchUserCredits();
    } else {
        setIsLoadingCredits(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (planId && plans.length > 0) {
      const plan = plans.find(p => p.id.toString() === planId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        toast.error('Plano não encontrado');
        navigate('/home');
      }
    }
  }, [planId, plans, navigate]);

  const isTextAudioPlan = selectedPlan?.name.toLowerCase().includes('text') && 
                         selectedPlan?.name.toLowerCase().includes('audio');

  const handleProceedToCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Nenhum plano selecionado');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (isTextAudioPlan) {
      if (userCredits < UPGRADE_COST) {
        toast.error(`Créditos insuficientes. Você precisa de ${UPGRADE_COST - userCredits} créditos a mais.`);
        return;
      }

      setLoading(true);
      
      try {
        // *** INÍCIO DA CORREÇÃO ***
        // A lógica agora chama a função RPC segura e centralizada no Supabase.
        // Isso resolve o erro '403 Forbidden' porque a operação é executada no servidor com as permissões corretas.
        const { data: upgradeSuccessful, error } = await supabase.rpc('upgrade_to_text_audio_with_subscription', {
          p_user_id: user.id,
          p_plan_id: selectedPlan.id
        });

        if (error) {
          throw new Error(error.message || 'Ocorreu um erro no servidor durante o upgrade.');
        }

        if (!upgradeSuccessful) {
          // A própria função RPC já valida os créditos, então esta mensagem é um fallback.
          toast.error('Créditos insuficientes. A transação foi recusada pelo servidor.');
          return;
        }
        
        toast.success('Upgrade realizado com sucesso! Sua assinatura de 30 dias foi ativada.');
        navigate('/chat-text-audio');
        // *** FIM DA CORREÇÃO ***

      } catch (error: any) {
        console.error('Erro ao processar upgrade:', error);
        toast.error(error.message || 'Ocorreu um erro inesperado durante o upgrade.');
      } finally {
        setLoading(false);
      }
    } else {
      // Lógica para outros planos (pagamento normal)
      setLoading(true);
      try {
        await selectPlan(selectedPlan.id);
      } catch (error: any) {
        console.error('Erro ao processar checkout:', error);
        toast.error(error.message || 'Erro ao processar pagamento');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-isa-dark flex items-center justify-center p-4">
        <Card className="card-isa w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-isa-muted">Carregando plano...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-isa-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-isa-purple hover:text-isa-white hover:bg-isa-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gradient-isa mb-2">
              Confirme Seu Plano
            </h1>
            <p className="text-isa-muted">
              Você está prestes a assinar o plano selecionado
            </p>
          </div>
        </div>

        <Card className="card-isa w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-isa-pink">{selectedPlan.name}</CardTitle>
            <CardDescription className="text-isa-muted">{selectedPlan.description}</CardDescription>
            <div className="text-3xl font-bold mt-4 text-isa-white">
              {selectedPlan.price === 0 
                ? "Grátis" 
                : `$${(selectedPlan.price / 100).toFixed(2)}/mês`}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-isa-light">Recursos inclusos:</h4>
              <div className="space-y-2">
                {selectedPlan.features.text && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-isa-purple" />
                    <span className="text-sm text-isa-muted">Conversas por texto</span>
                  </div>
                )}
                {selectedPlan.features.audio && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-isa-purple" />
                    <span className="text-sm text-isa-muted">Conversas por áudio</span>
                  </div>
                )}
                {selectedPlan.features.premium && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-isa-purple" />
                    <span className="text-sm text-isa-muted">Recursos premium</span>
                  </div>
                )}
              </div>
            </div>

            {selectedPlan.trial_days > 0 && (
              <div className="bg-isa-card p-4 rounded-lg border border-isa-purple/30">
                <p className="text-sm text-isa-purple">
                  <strong>Período de teste:</strong> {selectedPlan.trial_days} dias grátis
                </p>
              </div>
            )}

            {isTextAudioPlan && (
              <div className="space-y-3">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Upgrade com Créditos:</strong> Este plano custa {UPGRADE_COST} créditos
                  </p>
                  <p className="text-sm text-gray-400">
                    Seus créditos atuais: <span className="font-bold text-white">{isLoadingCredits ? 'Carregando...' : userCredits}</span>
                  </p>
                </div>

                {userCredits < UPGRADE_COST && !isLoadingCredits && (
                  <div className="flex items-center p-3 text-sm text-red-300 rounded-lg bg-red-900/20 border border-red-500/30">
                    <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3" />
                    <div>
                      <span className="font-medium">Créditos insuficientes!</span> Você precisa de mais {UPGRADE_COST - userCredits} créditos.
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleProceedToCheckout}
              className="btn-isa-primary w-full py-3 text-lg"
              disabled={loading || isLoadingCredits || (isTextAudioPlan && userCredits < UPGRADE_COST)}
            >
              {loading || isLoadingCredits ? 'Processando...' : 
               isTextAudioPlan 
                 ? `Upgrade com ${UPGRADE_COST} Créditos` 
                 : 'Finalizar Assinatura'}
            </Button>

            <p className="text-xs text-isa-muted text-center">
              Ao continuar, você concorda com nossos termos de serviço e política de privacidade.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SinglePlanProductPage;