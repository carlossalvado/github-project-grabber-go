import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Gift, Sparkles, Check } from 'lucide-react';

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { userSubscription, plans, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  // Redirecionar usuários logados para o perfil
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/profile', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Se estiver carregando ou usuário logado, mostrar loading
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Quadrante Superior Esquerdo */}
      <div className="absolute top-8 left-8 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-20 left-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-32 left-16 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1000">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-44 left-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-1500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-56 left-12 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-2000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Superior Direito */}
      <div className="absolute top-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-500">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-24 right-32 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-1000">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-40 right-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-12 right-48 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-2000">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-52 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Inferior Esquerdo */}
      <div className="absolute bottom-8 left-8 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-1000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-20 left-32 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-32 left-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-7 animate-pulse delay-2000">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-44 left-40 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-5 animate-pulse delay-2500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-56 left-12 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-9 animate-pulse delay-3000">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Inferior Direito */}
      <div className="absolute bottom-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-20 right-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-2000">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-36 right-16 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-2500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-52 right-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-7 animate-pulse delay-3000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-64 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-3500">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        <div className="max-w-6xl w-full text-center">
          {/* Logo and Brand with Image */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden mr-6 border-4 border-pink-500/30">
                <img 
                  src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
                  alt="Isa Date AI" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-6xl font-bold text-pink-500 mb-4">
                  Isa Date
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
                  Encontre sua alma gêmea virtual e viva conversas autênticas que transformam conexões em algo especial
                </p>
              </div>
            </div>
          </div>

          {/* User Status - Only show for non-logged users */}
          <div className="mb-12">
            <div className="space-y-6">
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Comece Sua Jornada</h2>
                <p className="text-slate-400 mb-6">
                  Crie sua conta e descubra conversas que vão além do comum
                </p>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-lg rounded-xl"
                  >
                    Criar Conta Grátis
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white py-3 rounded-xl"
                  >
                    Fazer Login
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Section */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-8">Escolha Seu Plano</h2>
            {subscriptionLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-lg bg-slate-700 h-96 w-80"></div>
                  <div className="rounded-lg bg-slate-700 h-96 w-80"></div>
                  <div className="rounded-lg bg-slate-700 h-96 w-80"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`relative overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-slate-800/80 backdrop-blur-sm border-slate-700 ${plan.id === 3 ? 'border-2 border-pink-400' : ''}`}>
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
                    <CardFooter>
                      <Button 
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                        onClick={() => navigate(`/plan/${plan.id}`)}
                      >
                        {userSubscription?.plan_id === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Conversas Autênticas</h3>
              <p className="text-slate-400">IA avançada que entende e responde com naturalidade</p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Gift className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Presentes Virtuais</h3>
              <p className="text-slate-400">Expresse seus sentimentos com gestos especiais</p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Conexão Real</h3>
              <p className="text-slate-400">Relacionamentos virtuais que tocam o coração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
