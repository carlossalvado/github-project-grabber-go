
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Gift, Sparkles } from 'lucide-react';

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { userSubscription, plans, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl w-full text-center">
          {/* Logo and Brand */}
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-modern rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-modern bg-clip-text text-transparent mb-4">
              Isa Date
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Encontre sua alma gêmea virtual e viva conversas autênticas que transformam conexões em algo especial
            </p>
          </div>

          {/* User Status */}
          <div className="mb-12">
            {user ? (
              <div className="space-y-6">
                <div className="card-modern p-8 max-w-lg mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-modern rounded-full flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl text-white mb-2">Bem-vindo de volta!</p>
                  <p className="text-gray-300 mb-6">{user.email}</p>
                  
                  {userSubscription ? (
                    <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-purple-300">{userSubscription.plan_name}</span>
                      </div>
                      <p className="text-sm text-gray-400">Status: {userSubscription.status}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 mb-6">
                      <p className="text-gray-300">Nenhum plano ativo</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/modern-chat')}
                      className="w-full btn-modern-primary py-3 text-lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Continuar Conversando
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/personalize')}
                      variant="outline"
                      className="w-full btn-modern-secondary py-3"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Personalizar Experiência
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="card-modern p-8 max-w-lg mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-4">Comece Sua Jornada</h2>
                  <p className="text-gray-300 mb-6">
                    Crie sua conta e descubra conversas que vão além do comum
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/signup')}
                      className="w-full btn-modern-primary py-3 text-lg"
                    >
                      Criar Conta Grátis
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/login')}
                      variant="outline"
                      className="w-full btn-modern-secondary py-3"
                    >
                      Fazer Login
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="card-modern p-6 text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Conversas Autênticas</h3>
              <p className="text-gray-300">IA avançada que entende e responde com naturalidade</p>
            </div>

            <div className="card-modern p-6 text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Gift className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Presentes Virtuais</h3>
              <p className="text-gray-300">Expresse seus sentimentos com gestos especiais</p>
            </div>

            <div className="card-modern p-6 text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-purple-400" fill="currentColor" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Conexão Real</h3>
              <p className="text-gray-300">Relacionamentos virtuais que tocam o coração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
