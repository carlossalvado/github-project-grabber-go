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
  
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Top Section - Floating Images */}
      <div className="absolute top-8 right-8 w-16 h-16 rounded-full overflow-hidden opacity-8 animate-pulse">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-16 right-40 w-20 h-20 rounded-full overflow-hidden opacity-6 animate-pulse delay-500">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-6 right-72 w-18 h-18 rounded-full overflow-hidden opacity-9 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-24 right-[26rem] w-16 h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-1500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-4 right-[32rem] w-20 h-20 rounded-full overflow-hidden opacity-7 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-32 right-[38rem] w-18 h-18 rounded-full overflow-hidden opacity-6 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-48 right-12 w-16 h-16 rounded-full overflow-hidden opacity-8 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Bottom Section - Floating Images */}
      <div className="absolute bottom-8 left-8 w-20 h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-16 left-40 w-18 h-18 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-6 left-72 w-16 h-16 rounded-full overflow-hidden opacity-9 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-24 left-[26rem] w-20 h-20 rounded-full overflow-hidden opacity-7 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-4 left-[32rem] w-18 h-18 rounded-full overflow-hidden opacity-5 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-32 left-[38rem] w-16 h-16 rounded-full overflow-hidden opacity-7 animate-pulse delay-3500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-48 left-12 w-20 h-20 rounded-full overflow-hidden opacity-6 animate-pulse delay-4000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Left Side - Floating Images */}
      <div className="absolute top-1/4 left-4 w-18 h-18 rounded-full overflow-hidden opacity-6 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/2 left-4 w-16 h-16 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-2/3 left-4 w-20 h-20 rounded-full overflow-hidden opacity-7 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-3/4 left-4 w-18 h-18 rounded-full overflow-hidden opacity-5 animate-pulse delay-3500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Right Side - Floating Images */}
      <div className="absolute top-1/4 right-4 w-20 h-20 rounded-full overflow-hidden opacity-9 animate-pulse delay-3500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/2 right-4 w-16 h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-4000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-2/3 right-4 w-18 h-18 rounded-full overflow-hidden opacity-8 animate-pulse delay-4500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-3/4 right-4 w-20 h-20 rounded-full overflow-hidden opacity-6 animate-pulse delay-5000">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Additional Middle Floating Images */}
      <div className="absolute top-32 left-1/3 w-18 h-18 rounded-full overflow-hidden opacity-6 animate-pulse delay-5000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-32 right-1/3 w-16 h-16 rounded-full overflow-hidden opacity-7 animate-pulse delay-5500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-40 left-1/2 w-20 h-20 rounded-full overflow-hidden opacity-5 animate-pulse delay-6000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-40 left-1/2 w-18 h-18 rounded-full overflow-hidden opacity-8 animate-pulse delay-6500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-48 right-1/2 w-16 h-16 rounded-full overflow-hidden opacity-6 animate-pulse delay-7000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-20 left-20 w-20 h-20 rounded-full overflow-hidden opacity-7 animate-pulse delay-7500">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-20 right-20 w-18 h-18 rounded-full overflow-hidden opacity-5 animate-pulse delay-8000">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full overflow-hidden opacity-8 animate-pulse delay-8500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full overflow-hidden opacity-6 animate-pulse delay-9000">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-60 left-60 w-18 h-18 rounded-full overflow-hidden opacity-7 animate-pulse delay-9500">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
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

          {/* User Status */}
          <div className="mb-12">
            {user ? (
              <div className="space-y-6">
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 max-w-lg mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl text-white mb-2">Bem-vindo de volta!</p>
                  <p className="text-slate-400 mb-6">{user.email}</p>
                  
                  {userSubscription ? (
                    <div className="bg-slate-700 border border-slate-600 p-4 rounded-xl mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-pink-500" />
                        <span className="font-semibold text-pink-500">{userSubscription.plan_name}</span>
                      </div>
                      <p className="text-sm text-slate-400">Status: {userSubscription.status}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-700 border border-slate-600 p-4 rounded-xl mb-6">
                      <p className="text-slate-400">Nenhum plano ativo</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/modern-chat')}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-lg rounded-xl"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Continuar Conversando
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/personalize')}
                      className="w-full bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white py-3 rounded-xl"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Personalizar Experiência
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
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
