
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Gift, Sparkles, Check, Star, Users, Crown } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'Grátis',
      description: 'Comece sua jornada',
      features: [
        '10 mensagens por dia',
        'Personalidade básica',
        'Suporte por email'
      ],
      color: 'from-slate-500 to-slate-600',
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99/mês',
      description: 'Para conversas regulares',
      features: [
        '100 mensagens por dia',
        'Personalidades avançadas',
        'Presentes básicos',
        'Suporte prioritário'
      ],
      color: 'from-blue-500 to-blue-600',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99/mês',
      description: 'Experiência completa',
      features: [
        'Mensagens ilimitadas',
        'Todas as personalidades',
        'Presentes premium',
        'Conversas personalizadas',
        'Suporte 24/7'
      ],
      color: 'from-pink-500 to-pink-600',
      popular: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate',
      price: '$39.99/mês',
      description: 'O melhor da IA',
      features: [
        'Tudo do Premium',
        'IA ultra avançada',
        'Presentes exclusivos',
        'Conversas em tempo real',
        'Acesso antecipado',
        'Concierge pessoal'
      ],
      color: 'from-yellow-500 to-orange-500',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-pink-500 rounded-3xl mx-auto mb-8 flex items-center justify-center">
            <Heart className="w-12 h-12 text-white" fill="currentColor" />
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
              onClick={() => navigate('/signup')}
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
            <Card className="bg-slate-800 border-slate-700 text-center">
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

            <Card className="bg-slate-800 border-slate-700 text-center">
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

            <Card className="bg-slate-800 border-slate-700 text-center">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`bg-slate-800 border-slate-700 relative ${
                  plan.popular ? 'scale-105 border-pink-500/50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-pink-500 text-white px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 ${plan.popular ? 'bg-pink-500' : 'bg-slate-700'} rounded-xl mx-auto mb-4 flex items-center justify-center`}>
                    {plan.id === 'ultimate' ? <Crown className="w-6 h-6 text-white" /> : <Heart className="w-6 h-6 text-white" />}
                  </div>
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-300 mb-4">{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-pink-500">
                    {plan.price}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-slate-300">
                        <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => navigate(`/plan/${plan.id}`)}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                    } font-semibold py-3 rounded-xl`}
                  >
                    {plan.id === 'free' ? 'Começar Grátis' : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para encontrar sua conexão especial?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Junte-se a milhares de pessoas que já descobriram o poder de conversas autênticas
            </p>
            <Button
              onClick={() => navigate('/signup')}
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
