
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import SinglePlanCard from '@/components/SinglePlanCard';
import { toast } from 'sonner';

const BasicPlanPage = () => {
  const { plans, loading, selectPlan } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [basicPlan, setBasicPlan] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    
    // Plano básico (ID: 2)
    const plan = plans.find(p => p.id === 2);
    
    if (!plan) {
      toast.error("Plano não encontrado");
      navigate('/');
      return;
    }

    setBasicPlan(plan);
    
    // Salvar ID do plano no localStorage
    localStorage.setItem('selectedPlanId', '2');
  }, [plans, loading, navigate]);

  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      // Se não estiver logado, direcionar para o cadastro
      localStorage.setItem('selectedPlanId', planId.toString());
      navigate('/signup');
      return;
    }

    // Se estiver logado, processar a assinatura
    try {
      console.log("Processando plano básico com ID:", planId);
      await selectPlan(planId);
      // O redirecionamento para o checkout acontece na função selectPlan
      // O redirecionamento para o chat vai acontecer após a confirmação do pagamento no Home.tsx
    } catch (error: any) {
      console.error("Erro ao selecionar plano:", error);
      toast.error(error.message || "Falha ao selecionar o plano");
    }
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

  if (!basicPlan) {
    return null; // Will redirect in useEffect
  }

  return <SinglePlanCard plan={basicPlan} onSelectPlan={handleSelectPlan} />;
};

export default BasicPlanPage;
