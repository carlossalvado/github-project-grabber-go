import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUserCache } from '@/hooks/useUserCache';
import { useTrialManager } from '@/hooks/useTrialManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Mail, CreditCard, Calendar, Sparkles, Crown, Heart, LogOut, MessageCircle, Edit, Loader2 } from 'lucide-react';
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
  // Estado para controlar o carregamento geral da página e evitar travamentos
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  // Combina toda a lógica de carregamento em uma única função
  const loadInitialData = async () => {
    if (!user) {
      setIsLoadingPage(false);
      return;
    }
    
    setIsLoadingPage(true);
    console.log('🔄 Iniciando carregamento de dados do perfil...');
    
    try {
      // Carrega dados do cache primeiro para uma experiência mais rápida
      loadFromCache();
      
      // Carrega o perfil do usuário e o status da assinatura em paralelo
      await Promise.all([
        loadUserProfile(),
        loadPlanData()
      ]);

      console.log('✅ Carregamento de dados do perfil concluído.');

    } catch (error) {
      console.error("❌ Erro geral ao carregar dados da página de perfil:", error);
      toast.error("Não foi possível carregar seus dados. Tente novamente.");
    } finally {
      // Garante que o estado de loading seja desativado no final
      setIsLoadingPage(false);
    }
  };
  
  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setUserProfile(data);
        setFullName(data.full_name || '');
        // O cache do perfil é salvo aqui
        saveProfile({ id: data.id, full_name: data.full_name, email: user.email || '', avatar_url: data.avatar_url, plan_name: data.plan_name, plan_active: data.plan_active });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do Supabase:', error);
    }
  };

  const loadPlanData = async () => {
    // A lógica do cache já atualiza o 'plan' com useUserCache.
    // Aqui focamos em verificar com o Supabase para ter os dados mais recentes.
    try {
      const result = await checkSubscriptionStatus(); // Esta função deve ir ao Supabase
      if (result?.hasActiveSubscription && result?.planName) {
        // Atualiza o cache com a informação fresca do Supabase
        saveProfile({ plan_name: result.planName, plan_active: true });
        console.log('🔄 Cache atualizado com status do plano vindo do Supabase.');
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura no Supabase:', error);
    }
  };

  // useEffect principal para carregar os dados uma vez
  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setIsLoadingPage(false);
    }
  }, [user]);

  // useEffect para lidar com o retorno do checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'success' && user) {
      toast.info('Pagamento confirmado! Atualizando seu plano...');
      setTimeout(() => {
        loadInitialData(); // Recarrega todos os dados
      }, 2000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim()) return;
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) throw error;
      saveProfile({ full_name: fullName.trim() });
      setIsEditingName(false);
      toast.success('Nome atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar nome');
    }
  };

  const handleAvatarUpdate = (avatarUrl: string) => {
    updateAvatar(avatarUrl);
    setUserProfile((prev: any) => prev ? { ...prev, avatar_url: avatarUrl } : null);
  };

  const handleGoToChat = () => {
    if (!user) {
      toast.error('Você precisa estar logado para continuar.');
      navigate('/login');
      return;
    }
    if (!hasAnyActivePlan()) {
      console.warn("handleGoToChat foi chamado sem um plano ativo. A ação foi ignorada.");
      return;
    }
    const planName = getActivePlanName();
    let targetPath = '';
    switch (planName) {
      case 'Trial':
        targetPath = '/chat-trial';
        break;
      case 'Text & Audio':
        targetPath = '/chat-text-audio';
        break;
      default:
        toast.error(`A página de chat para o plano "${planName}" ainda não está disponível.`);
        return;
    }
    toast.success('Redirecionando para o chat...');
    navigate(targetPath);
  };

  const hasAnyActivePlan = () => isTrialActive || hasPlanActive();
  const getActivePlanName = () => isTrialActive ? "Trial" : getPlanName();
  const currentPlan = plans.find(p => p.name === getActivePlanName());
  const displayName = fullName || getFullName() || 'Usuário';
  const avatarUrl = userProfile?.avatar_url || getAvatarUrl();

  // Se a página estiver carregando, mostre um spinner
  if (isLoadingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <Loader2 className="w-16 h-16 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
        <TrialTimer />
        {/* ... Background Elements ... */}
        <div className="container mx-auto px-4 py-8 relative z-10">
            {/* ... Header e Profile Overview Card ... */}
            <div className="text-center mb-12">
                <div className="relative inline-block">
                    <AvatarUpload currentAvatarUrl={avatarUrl} onAvatarUpdate={handleAvatarUpdate} userName={displayName} />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">Meu Perfil</h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">Gerencie suas informações e personalize sua experiência</p>
            </div>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* ... Card de Nome e Email ... */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-pink-500" /> Plano Atual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {hasAnyActivePlan() && getActivePlanName() ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <Badge variant="default" className={`text-xl px-6 py-2 font-bold shadow-lg ${getActivePlanName() === 'Trial' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-pink-500 to-purple-600'} text-white`}>
                                                {getActivePlanName()}
                                            </Badge>
                                        </div>
                                    </div>
                                    {/* ======================================= */}
                                    {/* ESTE BLOCO FOI RESTAURADO */}
                                    {/* ======================================= */}
                                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6 text-center">
                                      <div className="flex items-center justify-center gap-2 mb-4">
                                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                          <span className="text-green-400 font-semibold text-lg">Ativo</span>
                                      </div>
                                      {isTrialActive ? (
                                          <div className="space-y-3">
                                              <p className="text-green-400 text-2xl font-bold">Grátis</p>
                                              <p className="text-slate-300 text-sm">Acesso completo por tempo limitado.</p>
                                          </div>
                                      ) : currentPlan && (
                                          <div className="space-y-3">
                                              <p className="text-pink-400 text-2xl font-bold">U$ {currentPlan.price}/mês</p>
                                              <p className="text-slate-300 text-sm">{currentPlan.description}</p>
                                          </div>
                                      )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-8">
                                        <Heart className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-400 text-lg">Nenhum plano ativo</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ... Card de Informações da Conta ... */}
                     <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
                        <CardHeader>
                           <CardTitle className="text-2xl text-white flex items-center gap-3"><Mail className="w-6 h-6 text-blue-500" />Informações da Conta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6">
                                <p className="text-slate-400 text-sm">Email</p><p className="text-white text-lg font-medium">{user?.email}</p>
                            </div>
                            <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6">
                               <p className="text-slate-400 text-sm">Status da Conta</p><p className="text-green-400 text-lg font-medium">Verificada</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ações Rápidas */}
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white flex items-center gap-3"><User className="w-6 h-6 text-purple-500" />Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hasAnyActivePlan() && (
                                <Button onClick={handleGoToChat} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-semibold">
                                    <MessageCircle className="w-5 h-5 mr-2" /> Ir para Chat
                                </Button>
                            )}
                            <Button onClick={handleSignOut} variant="outline" className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-xl font-semibold">
                                <LogOut className="w-5 h-5 mr-2" /> Sair
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