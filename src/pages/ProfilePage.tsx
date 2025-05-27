
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUserCache } from '@/hooks/useUserCache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, CreditCard, Calendar, Sparkles, Crown, Heart, Settings, LogOut, MessageCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { userSubscription, plans, checkSubscriptionStatus } = useSubscription();
  const { plan, profile, hasPlanActive, getPlanName, loadFromCache } = useUserCache();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Escutar eventos de atualização do plano
  useEffect(() => {
    const handlePlanUpdate = (event: any) => {
      console.log('📢 Evento de atualização do plano recebido:', event.detail);
      toast.success('Plano atualizado com sucesso!');
    };

    window.addEventListener('planUpdated', handlePlanUpdate);
    return () => window.removeEventListener('planUpdated', handlePlanUpdate);
  }, []);

  // Recarregar cache ao montar o componente
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRefreshPlan = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Atualizando status do plano...');
      await checkSubscriptionStatus();
      loadFromCache(); // Recarregar do cache após atualização
      toast.success('Status do plano atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar status do plano');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCurrentPlan = () => {
    // Priorizar dados do cache
    const cachedPlanName = getPlanName();
    if (cachedPlanName && hasPlanActive()) {
      return plans.find(p => p.name === cachedPlanName);
    }
    
    // Fallback para subscription
    if (!userSubscription) return null;
    return userSubscription.plan || plans.find(plan => plan.id === userSubscription.plan_id);
  };

  const currentPlan = getCurrentPlan();
  const planActive = hasPlanActive();
  const planName = getPlanName() || userSubscription?.plan_name;

  const handleChatRedirect = () => {
    if (!planActive || !planName) {
      navigate('/chat-free');
      return;
    }

    const lowerPlanName = planName.toLowerCase();
    
    if (lowerPlanName.includes('basic') || lowerPlanName.includes('básico')) {
      navigate('/chat-basic');
    } else if (lowerPlanName.includes('premium')) {
      navigate('/chat-premium');
    } else if (lowerPlanName.includes('ultimate')) {
      navigate('/chat-ultimate');
    } else {
      navigate('/modern-chat');
    }
  };

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

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full overflow-hidden opacity-40">
              <img 
                src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
                alt="AI Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Meu Perfil
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Gerencie suas informações e personalize sua experiência
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Overview Card */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="relative inline-block">
                <div className="w-28 h-28 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-4xl text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-slate-800"></div>
              </div>
              <CardTitle className="text-3xl text-white">{user?.email}</CardTitle>
              <CardDescription className="text-lg text-slate-300">
                Membro ativo da comunidade Isa Date
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subscription Information */}
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-pink-500" />
                  </div>
                  Plano Atual
                  <Button
                    onClick={handleRefreshPlan}
                    disabled={isRefreshing}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-slate-400 hover:text-white"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {planActive && planName ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        {currentPlan?.name === 'Ultimate' && <Crown className="w-8 h-8 text-yellow-500" />}
                        {currentPlan?.name === 'Premium' && <Sparkles className="w-8 h-8 text-purple-500" />}
                        {currentPlan?.name === 'Basic' && <Heart className="w-8 h-8 text-pink-500" />}
                        <Badge 
                          variant="default" 
                          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xl px-6 py-2 font-bold shadow-lg"
                        >
                          {planName}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6 text-center">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-semibold text-lg">Ativo</span>
                      </div>
                      
                      {currentPlan && (
                        <div className="space-y-3">
                          <p className="text-pink-400 text-2xl font-bold">
                            R$ {currentPlan.price}/mês
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {currentPlan.description}
                          </p>
                        </div>
                      )}

                      {/* Debug info */}
                      {plan && (
                        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400">
                            Cache: {new Date(plan.cached_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-8">
                      <div className="w-16 h-16 bg-slate-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400 mb-6 text-lg">Nenhum plano ativo</p>
                      <Button 
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
                      >
                        Escolher Plano
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white text-lg font-medium">{user?.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Status da Conta</p>
                      <p className="text-green-400 text-lg font-medium">Verificada</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-500" />
                </div>
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={handleChatRedirect}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Ir para Chat
                </Button>
                
                <Button 
                  onClick={() => navigate('/personalize')}
                  className="bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Personalizar
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
