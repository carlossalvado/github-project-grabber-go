
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import SinglePlanCard from '@/components/SinglePlanCard';
import { toast } from 'sonner';

const PlanPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const { plans, loading, selectPlan } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!planId || isNaN(parseInt(planId))) {
      toast.error("ID do plano inválido");
      navigate('/plans');
      return;
    }

    const planIdNumber = parseInt(planId);
    const plan = plans.find(p => p.id === planIdNumber);
    
    if (!plan) {
      toast.error("Plano não encontrado");
      navigate('/plans');
      return;
    }

    setSelectedPlan(plan);
    
    // Save selected plan ID to localStorage
    localStorage.setItem('selectedPlanId', planIdNumber.toString());
  }, [planId, plans, loading, navigate]);

  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      // Se não estiver logado, direcionar para o cadastro
      localStorage.setItem('selectedPlanId', planId.toString());
      navigate('/signup');
      return;
    }

    // Se estiver logado, processar a assinatura
    try {
      await selectPlan(planId);
      // O redirecionamento para o checkout acontece na função selectPlan
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

  if (!selectedPlan) {
    return null; // Will redirect in useEffect
  }

  return <SinglePlanCard plan={selectedPlan} onSelectPlan={handleSelectPlan} />;
};

export default PlanPage;
