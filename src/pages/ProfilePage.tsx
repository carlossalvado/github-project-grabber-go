import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUserCache } from '@/hooks/useUserCache';
import { useTrialManager } from '@/hooks/useTrialManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Mail, CreditCard, Calendar, Sparkles, Crown, Heart, LogOut, MessageCircle, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AvatarUpload from '@/components/AvatarUpload';
import TrialTimer from '@/components/TrialTimer';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { userSubscription, plans, checkSubscriptionStatus } = useSubscription();
  const { plan, profile, hasPlanActive, getPlanName, getAvatarUrl, getFullName, loadFromCache, updateAvatar, saveProfile } = useUserCache();
  const { trialData, isTrialActive, loading: trialLoading } = useTrialManager();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Escutar eventos de atualização do plano
  useEffect(() => {
    const handlePlanUpdate = (event: any) => {
      console.log('📢 Evento de atualização do plano recebido:', event.detail);
      toast.success('Plano atualizado com sucesso!');
      // Forçar recarregamento dos dados
      loadPlanData();
    };

    window.addEventListener('planUpdated', handlePlanUpdate);
    return () => window.removeEventListener('planUpdated', handlePlanUpdate);
  }, []);

  // Carregar dados do perfil do Supabase
  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        setFullName(data.full_name || '');
        
        // Salvar no cache
        saveProfile({
          id: data.id,
          full_name: data.full_name,
          email: user.email || '',
          avatar_url: data.avatar_url,
          plan_name: data.plan_name,
          plan_active: data.plan_active
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  // Função para carregar dados do plano (cache primeiro, depois Supabase)
  const loadPlanData = async () => {
    console.log('🔍 Carregando dados do plano...');
    
    // Primeiro tentar do cache
    loadFromCache();
    
    // Se não tiver dados no cache ou se plan_active for false, verificar no Supabase
    if (!plan?.plan_active) {
      console.log('📡 Verificando status no Supabase...');
      try {
        const result = await checkSubscriptionStatus();
        if (result?.hasActiveSubscription && result?.planName) {
          console.log('✅ Plano ativo encontrado no Supabase:', result);
          setPlanData({
            plan_name: result.planName,
            plan_active: true,
            from_supabase: true
          });
        }
      } catch (error) {
        console.error('❌ Erro ao verificar Supabase:', error);
      }
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (user) {
      loadPlanData();
      loadUserProfile();
    }
  }, [user]);

  // Verificar se há parâmetros de URL que indicam sucesso do pagamento
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    
    if (checkoutStatus === 'success' && user) {
      console.log('🎉 Checkout success detectado, verificando dados...');
      // Aguardar um pouco e recarregar dados
      setTimeout(() => {
        loadPlanData();
      }, 2000);
      
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    // Redirecionar para home após logout
    navigate('/', { replace: true });
  };

  const handleSaveName = async () => {
    if (!user || !fullName.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Atualizar cache
      saveProfile({
        id: user.id,
        full_name: fullName.trim(),
        email: user.email || '',
        avatar_url: getAvatarUrl(),
        plan_name: getPlanName(),
        plan_active: hasPlanActive()
      });

      setIsEditingName(false);
      toast.success('Nome atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome');
    }
  };

  const handleAvatarUpdate = (avatarUrl: string) => {
    updateAvatar(avatarUrl);
    setUserProfile((prev: any) => prev ? { ...prev, avatar_url: avatarUrl } : null);
  };

  const getCurrentPlan = () => {
    // Priorizar dados mais recentes
    if (planData?.plan_active) {
      return plans.find(p => p.name === planData.plan_name);
    }
    
    // Usar dados do cache
    const cachedPlanName = getPlanName();
    if (cachedPlanName && hasPlanActive()) {
      return plans.find(p => p.name === cachedPlanName);
    }
    
    // Fallback para subscription
    if (!userSubscription) return null;
    return userSubscription.plan || plans.find(plan => plan.id === userSubscription.plan_id);
  };

  const hasAnyActivePlan = () => {
    // Verificar trial ativo primeiro
    if (isTrialActive) return true;
    
    // Verificar plano pago ativo
    const isActivePlan = planData?.plan_active || hasPlanActive();
    return isActivePlan;
  };

  const getActivePlanName = () => {
    // Se trial ativo, retornar "Trial"
    if (isTrialActive) return "Trial";
    
    // Caso contrário, retornar nome do plano pago
    return planData?.plan_name || getPlanName() || userSubscription?.plan_name;
  };

  const handleChatRedirect = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para acessar o chat');
      navigate('/login');
      return;
    }

    try {
      // Verificar se tem plano Text & Audio ativo
      const activePlanName = planData?.plan_name || getPlanName() || userSubscription?.plan_name;
      const isActivePlan = planData?.plan_active || hasPlanActive();
      
      if (isActivePlan && activePlanName && 
          (activePlanName.toLowerCase().includes('text') && activePlanName.toLowerCase().includes('audio'))) {
        navigate('/chat-text-audio');
        toast.success('Redirecionando para o chat Text & Audio');
        return;
      }

      // Se não tem plano Text & Audio ativo, verificar se tem trial ativo
      if (isTrialActive) {
        navigate('/chat-trial');
        toast.success('Redirecionando para o chat trial');
        return;
      }

      // Fallback para chat trial
      navigate('/chat-trial');
      toast.info('Redirecionando para o chat trial');
    } catch (error: any) {
      console.error('Erro ao verificar plano do usuário:', error);
      navigate('/chat-trial');
      toast.info('Redirecionando para o chat trial');
    }
  };

  const currentPlan = getCurrentPlan();
  const activePlanName = getActivePlanName();
  const displayName = fullName || getFullName() || 'Usuário';
  const avatarUrl = userProfile?.avatar_url || getAvatarUrl();

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Trial Timer - Apenas para usuários trial */}
      <TrialTimer />

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
            <AvatarUpload 
              currentAvatarUrl={avatarUrl}
              onAvatarUpdate={handleAvatarUpdate}
              userName={displayName}
            />
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
              <div className="flex items-center justify-center gap-4 mb-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button onClick={handleSaveName} size="sm">
                      Salvar
                    </Button>
                    <Button 
                      onClick={() => setIsEditingName(false)} 
                      variant="outline" 
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-3xl text-white">{displayName}</CardTitle>
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription className="text-lg text-slate-300">
                {user?.email}
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasAnyActivePlan() && activePlanName ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        {activePlanName === 'Ultimate' && <Crown className="w-8 h-8 text-yellow-500" />}
                        {activePlanName === 'Premium' && <Sparkles className="w-8 h-8 text-purple-500" />}
                        {activePlanName === 'Basic' && <Heart className="w-8 h-8 text-pink-500" />}
                        {activePlanName === 'Trial' && <Heart className="w-8 h-8 text-green-500" />}
                        {activePlanName && activePlanName.toLowerCase().includes('text') && activePlanName.toLowerCase().includes('audio') && <Heart className="w-8 h-8 text-pink-500" />}
                        <Badge 
                          variant="default" 
                          className={`text-xl px-6 py-2 font-bold shadow-lg ${
                            activePlanName === 'Trial' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          }`}
                        >
                          {activePlanName}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6 text-center">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-semibold text-lg">Ativo</span>
                      </div>
                      
                      {isTrialActive ? (
                        <div className="space-y-3">
                          <p className="text-green-400 text-2xl font-bold">
                            Grátis
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            Trial de 72 horas - Acesso completo por tempo limitado
                          </p>
                        </div>
                      ) : activePlanName && activePlanName.toLowerCase().includes('text') && activePlanName.toLowerCase().includes('audio') ? (
                        <div className="space-y-3">
                          <p className="text-pink-400 text-2xl font-bold">
                            U$ 20,99/mês
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            Dados carregados...
                          </p>
                        </div>
                      ) : currentPlan && (
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
                      {planData?.from_supabase && (
                        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400">
                            Dados carregados do Supabase
                          </p>
                        </div>
                      )}
                      
                      {isTrialActive && (
                        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400">
                            Trial ativo
                          </p>
                        </div>
                      )}
                      
                      {plan && !planData?.from_supabase && !isTrialActive && (
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
                  <User className="w-6 h-6 text-purple-500" />
                </div>
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Só mostrar o botão se tiver um plano ativo */}
                {hasAnyActivePlan() && (
                  <Button 
                    onClick={handleChatRedirect}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Ir para Chat
                  </Button>
                )}
                
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
