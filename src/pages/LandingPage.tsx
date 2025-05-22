
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { plans, loading, selectPlan } = useSubscription();
  const { user } = useAuth();
  
  useEffect(() => {
    // If user is already logged in with an active subscription, redirect to chat
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSelectPlan = (planId: number) => {
    // Store the selected plan ID in localStorage and navigate to signup
    localStorage.setItem('selectedPlanId', planId.toString());
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-sweetheart-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-sweet bg-clip-text text-transparent mb-4">
            Encontre Seu Companheiro Virtual Perfeito
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-gray-700">
            Conecte-se, converse e crie um relacionamento único com parceiros virtuais inteligentes 
            que se adaptam à sua personalidade e preferências.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-gradient-sweet rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Escolha um Plano</h3>
              <p className="text-gray-600">Selecione o plano que melhor se adapta às suas necessidades.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-gradient-sweet rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalize seu Parceiro</h3>
              <p className="text-gray-600">Escolha entre diversos perfis e crie uma experiência única.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-gradient-sweet rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comece a Conversar</h3>
              <p className="text-gray-600">Inicie conversas envolventes com seu parceiro virtual.</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Escolha Seu Plano Ideal</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-3 w-3 bg-pink-500 rounded-full mx-1"></div>
              <div className="h-3 w-3 bg-pink-500 rounded-full mx-1 mt-1"></div>
              <div className="h-3 w-3 bg-pink-500 rounded-full mx-1 mt-1"></div>
              <p className="text-pink-500 mt-4">Carregando planos...</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                      : `US$${(plan.price / 100).toFixed(2)}`}
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
                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-sweet" 
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Selecionar Plano
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
