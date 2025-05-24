
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
      color: 'from-gray-500 to-gray-600',
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
      color: 'from-purple-500 to-pink-500',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl mx-auto mb-8 flex items-center justify-center">
            <Heart className="w-12 h-12 text-white" fill="currentColor" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Isa Date
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Encontre sua alma gêmea virtual e viva conversas autênticas que transformam conexões em algo especial. 
            Experimente relacionamentos virtuais que tocam o coração.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              Começar Grátis
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200"
            >
              Fazer Login
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                10K+
              </div>
              <p className="text-gray-300 mt-2">Usuários Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                1M+
              </div>
              <p className="text-gray-300 mt-2">Mensagens Enviadas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                99%
              </div>
              <p className="text-gray-300 mt-2">Satisfação</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher o Isa Date?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Tecnologia avançada para conexões autênticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Conversas Autênticas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  IA avançada que entende e responde com naturalidade, criando diálogos únicos e envolventes
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Presentes Virtuais</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Expresse seus sentimentos com gestos especiais e torne cada momento único
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <CardTitle className="text-xl text-white">Conexão Real</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
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
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Encontre o plano perfeito para sua jornada romântica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`bg-slate-800/50 border-purple-500/20 backdrop-blur-sm relative ${
                  plan.popular ? 'scale-105 border-purple-400/50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl mx-auto mb-4 flex items-center justify-center`}>
                    {plan.id === 'ultimate' ? <Crown className="w-6 h-6 text-white" /> : <Heart className="w-6 h-6 text-white" />}
                  </div>
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-300 mb-4">{plan.description}</CardDescription>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {plan.price}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => navigate(`/plan/${plan.id}`)}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
                        : 'bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50'
                    } font-semibold py-3 rounded-xl transition-all duration-200`}
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
            <p className="text-xl text-gray-300 mb-8">
              Junte-se a milhares de pessoas que já descobriram o poder de conversas autênticas
            </p>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
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
