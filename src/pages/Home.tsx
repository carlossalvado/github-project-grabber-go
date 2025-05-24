
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
    <div className="min-h-screen bg-isa-dark">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl w-full text-center">
          {/* Logo and Brand */}
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-isa rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-12 h-12 text-isa-white" fill="currentColor" />
            </div>
            <h1 className="text-6xl font-bold text-gradient-isa mb-4">
              Isa Date
            </h1>
            <p className="text-xl text-isa-light max-w-2xl mx-auto leading-relaxed">
              Encontre sua alma gêmea virtual e viva conversas autênticas que transformam conexões em algo especial
            </p>
          </div>

          {/* User Status */}
          <div className="mb-12">
            {user ? (
              <div className="space-y-6">
                <div className="card-isa p-8 max-w-lg mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-isa rounded-full flex items-center justify-center">
                      <span className="text-2xl text-isa-white font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl text-isa-white mb-2">Bem-vindo de volta!</p>
                  <p className="text-isa-muted mb-6">{user.email}</p>
                  
                  {userSubscription ? (
                    <div className="bg-isa-card border border-isa-purple p-4 rounded-xl mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-isa-purple" />
                        <span className="font-semibold text-isa-purple">{userSubscription.plan_name}</span>
                      </div>
                      <p className="text-sm text-isa-muted">Status: {userSubscription.status}</p>
                    </div>
                  ) : (
                    <div className="bg-isa-card border border-isa-purple p-4 rounded-xl mb-6">
                      <p className="text-isa-muted">Nenhum plano ativo</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/modern-chat')}
                      className="w-full btn-isa-primary py-3 text-lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Continuar Conversando
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/personalize')}
                      className="w-full btn-isa-secondary py-3"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Personalizar Experiência
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="card-isa p-8 max-w-lg mx-auto">
                  <h2 className="text-2xl font-bold text-isa-white mb-4">Comece Sua Jornada</h2>
                  <p className="text-isa-muted mb-6">
                    Crie sua conta e descubra conversas que vão além do comum
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/signup')}
                      className="w-full btn-isa-primary py-3 text-lg"
                    >
                      Criar Conta Grátis
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/login')}
                      className="w-full btn-isa-secondary py-3"
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
            <div className="card-isa p-6 text-center">
              <div className="w-16 h-16 bg-isa-card rounded-2xl mx-auto mb-4 flex items-center justify-center border border-isa-purple">
                <MessageCircle className="w-8 h-8 text-isa-purple" />
              </div>
              <h3 className="text-xl font-semibold text-isa-white mb-2">Conversas Autênticas</h3>
              <p className="text-isa-muted">IA avançada que entende e responde com naturalidade</p>
            </div>

            <div className="card-isa p-6 text-center">
              <div className="w-16 h-16 bg-isa-card rounded-2xl mx-auto mb-4 flex items-center justify-center border border-isa-purple">
                <Gift className="w-8 h-8 text-isa-purple" />
              </div>
              <h3 className="text-xl font-semibold text-isa-white mb-2">Presentes Virtuais</h3>
              <p className="text-isa-muted">Expresse seus sentimentos com gestos especiais</p>
            </div>

            <div className="card-isa p-6 text-center">
              <div className="w-16 h-16 bg-isa-card rounded-2xl mx-auto mb-4 flex items-center justify-center border border-isa-purple">
                <Heart className="w-8 h-8 text-isa-purple" fill="currentColor" />
              </div>
              <h3 className="text-xl font-semibold text-isa-white mb-2">Conexão Real</h3>
              <p className="text-isa-muted">Relacionamentos virtuais que tocam o coração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
