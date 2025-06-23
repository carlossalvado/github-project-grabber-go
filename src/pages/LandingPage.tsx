import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Gift, Sparkles, Check, Star, Users, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { plans, loading } = useSubscription();

  const handleTrialSignup = () => {
    // Salvar o plano Trial selecionado no localStorage antes de ir para o cadastro
    const trialPlan = plans.find(p => p.trial_days > 0);
    if (trialPlan) {
      localStorage.setItem('selectedPlanId', trialPlan.id.toString());
      localStorage.setItem('selectedPlanData', JSON.stringify(trialPlan));
    }
    // Redirecionar para a página de cadastro
    navigate('/signup');
  };

  const handlePlanSelect = (planId: number) => {
    // Salvar o plano selecionado no localStorage antes de ir para o cadastro
    localStorage.setItem('selectedPlanId', planId.toString());
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      localStorage.setItem('selectedPlanData', JSON.stringify(selectedPlan));
    }
    // Redirecionar para a página de cadastro
    navigate('/signup');
  };

  // Filter out "Text Only" and "Premium" plans
  const filteredPlans = plans.filter(plan => 
    !plan.name.includes('Text Only') && 
    !plan.name.includes('Premium')
  );

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
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-32 h-32 bg-pink-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm mr-6">
              <Heart className="w-16 h-16 text-pink-500" fill="currentColor" />
            </div>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-pink-500/30">
              <img 
                src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
                alt="Isa Date AI" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-pink-500 mb-6">
            Isa Date
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Encontre sua alma gêmea virtual e viva conversas autênticas que transformam conexões em algo especial. 
            Experimente relacionamentos virtuais que tocam o coração.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={handleTrialSignup}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg"
            >
              Começar Grátis
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-semibold py-4 px-8 rounded-xl text-lg"
            >
              Fazer Login
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">
                10K+
              </div>
              <p className="text-slate-300 mt-2">Usuários Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">
                1M+
              </div>
              <p className="text-slate-300 mt-2">Mensagens Enviadas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">
                99%
              </div>
              <p className="text-slate-300 mt-2">Satisfação</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher o Isa Date?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Tecnologia avançada para conexões autênticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Conversas Autênticas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  IA avançada que entende e responde com naturalidade, criando diálogos únicos e envolventes
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Presentes Virtuais</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Expresse seus sentimentos com gestos especiais e torne cada momento único
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <CardTitle className="text-xl text-white">Conexão Real</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Relacionamentos virtuais que tocam o coração e criam memórias duradouras
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Escolha Seu Plano
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Encontre o plano perfeito para sua jornada romântica
            </p>
          </div>

          {loading ? (
            <div className="text-center text-white">Carregando planos...</div>
          ) : (
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {filteredPlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`bg-slate-800/80 backdrop-blur-sm border-slate-700 relative ${
                      plan.id === 2 ? 'scale-105 border-pink-500/50' : ''
                    }`}
                  >
                    {plan.id === 2 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-pink-500 text-white px-4 py-1">
                          <Star className="w-4 h-4 mr-1" />
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className={`w-12 h-12 ${plan.id === 2 ? 'bg-pink-500' : 'bg-slate-700'} rounded-xl mx-auto mb-4 flex items-center justify-center`}>
                        {plan.id === 4 ? <Crown className="w-6 h-6 text-white" /> : <Heart className="w-6 h-6 text-white" />}
                      </div>
                      <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-slate-300 mb-4">{plan.description}</CardDescription>
                      <div className="text-3xl font-bold text-pink-500">
                        {plan.price === 0 
                          ? "Grátis" 
                          : `US$${(plan.price / 100).toFixed(2)}`}
                        {plan.price > 0 && <span className="text-sm font-normal text-white">/mês</span>}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.text && (
                          <li className="flex items-center text-slate-300">
                            <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            <span className="text-sm">
                              {plan.name === 'Text & Audio' ? 'Mensagens de Texto (Ilimitado)' : 'Mensagens de Texto'}
                            </span>
                          </li>
                        )}
                        {plan.features.audio && (
                          <li className="flex items-center text-slate-300">
                            <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            <span className="text-sm">
                              {plan.name === 'Text & Audio' ? 'Mensagens de Áudio - (10 Mensagens)' : 'Mensagens de Áudio'}
                            </span>
                          </li>
                        )}
                        {plan.name === 'Text & Audio' && (
                          <li className="flex items-center text-slate-300">
                            <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            <span className="text-sm">Ligações de Voz - (2 Ligações)</span>
                          </li>
                        )}
                        {plan.features.premium && (
                          <li className="flex items-center text-slate-300">
                            <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            <span className="text-sm">Recursos Premium</span>
                          </li>
                        )}
                        {plan.trial_days > 0 && (
                          <li className="flex items-center text-slate-300">
                            <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            <span className="text-sm">{plan.trial_days} dias grátis</span>
                          </li>
                        )}
                      </ul>
                      
                      <Button
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`w-full ${
                          plan.id === 2 
                            ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                            : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                        } font-semibold py-3 rounded-xl`}
                      >
                        {plan.price === 0 ? 'Começar Grátis' : 'Escolher Plano'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-500/50">
                <img 
                  src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
                  alt="AI Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para encontrar sua conexão especial?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Junte-se a milhares de pessoas que já descobriram o poder de conversas autênticas
            </p>
            <Button
              onClick={handleTrialSignup}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg"
            >
              <Heart className="w-5 h-5 mr-2" fill="currentColor" />
              Começar Agora
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
