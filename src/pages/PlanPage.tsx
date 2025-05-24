
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
        
        {/* Tripled Background Images for Loading */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full overflow-hidden opacity-10 animate-pulse">
          <img 
            src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-40 right-60 w-24 h-24 rounded-full overflow-hidden opacity-8 animate-pulse delay-500">
          <img 
            src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-10 right-96 w-28 h-28 rounded-full overflow-hidden opacity-12 animate-pulse delay-1000">
          <img 
            src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute bottom-20 left-20 w-36 h-36 rounded-full overflow-hidden opacity-15 animate-pulse delay-1000">
          <img 
            src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-40 left-60 w-20 h-20 rounded-full overflow-hidden opacity-12 animate-pulse delay-1500">
          <img 
            src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-10 left-96 w-32 h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-2000">
          <img 
            src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute top-1/2 left-10 w-24 h-24 rounded-full overflow-hidden opacity-10 animate-pulse delay-2500">
          <img 
            src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-1/3 right-10 w-28 h-28 rounded-full overflow-hidden opacity-14 animate-pulse delay-3000">
          <img 
            src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-2/3 left-5 w-26 h-26 rounded-full overflow-hidden opacity-11 animate-pulse delay-3500">
          <img 
            src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="animate-pulse flex flex-col items-center relative z-10">
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
