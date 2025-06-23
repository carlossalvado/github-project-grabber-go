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

  // ... (toda a lógica de useEffects e outras funções permanece a mesma)

  useEffect(() => {
    const handlePlanUpdate = (event: any) => {
      console.log('📢 Evento de atualização do plano recebido:', event.detail);
      toast.success('Plano atualizado com sucesso!');
      loadPlanData();
    };
    window.addEventListener('planUpdated', handlePlanUpdate);
    return () => window.removeEventListener('planUpdated', handlePlanUpdate);
  }, []);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error);
        return;
      }
      if (data) {
        setUserProfile(data);
        setFullName(data.full_name || '');
        saveProfile({ id: data.id, full_name: data.full_name, email: user.email || '', avatar_url: data.avatar_url, plan_name: data.plan_name, plan_active: data.plan_active });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const loadPlanData = async () => {
    console.log('🔍 Carregando dados do plano...');
    loadFromCache();
    if (!plan?.plan_active) {
      console.log('📡 Verificando status no Supabase...');
      try {
        const result = await checkSubscriptionStatus();
        if (result?.hasActiveSubscription && result?.planName) {
          console.log('✅ Plano ativo encontrado no Supabase:', result);
          setPlanData({ plan_name: result.planName, plan_active: true, from_supabase: true });
        }
      } catch (error) {
        console.error('❌ Erro ao verificar Supabase:', error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadPlanData();
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    if (checkoutStatus === 'success' && user) {
      console.log('🎉 Checkout success detectado, verificando dados...');
      setTimeout(() => { loadPlanData(); }, 2000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleSaveName = async () => {
    if (!user || !fullName.trim()) return;
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) throw error;
      saveProfile({ id: user.id, full_name: fullName.trim(), email: user.email || '', avatar_url: getAvatarUrl(), plan_name: getPlanName(), plan_active: hasPlanActive() });
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

  const handleGoToChat = () => {
    if (!user) {
      toast.error('Você precisa estar logado para continuar.');
      navigate('/login');
      return;
    }
    if (!hasAnyActivePlan()) {
        // Se essa função for chamada sem um plano ativo, não faz nada.
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

  const getCurrentPlan = () => {
    if (planData?.plan_active) return plans.find(p => p.name === planData.plan_name);
    const cachedPlanName = getPlanName();
    if (cachedPlanName && hasPlanActive()) return plans.find(p => p.name === cachedPlanName);
    if (!userSubscription) return null;
    return userSubscription.plan || plans.find(plan => plan.id === userSubscription.plan_id);
  };

  const hasAnyActivePlan = () => {
    if (isTrialActive) return true;
    const isActivePlan = planData?.plan_active || hasPlanActive();
    return isActivePlan;
  };

  const getActivePlanName = () => {
    if (isTrialActive) return "Trial";
    return planData?.plan_name || getPlanName() || userSubscription?.plan_name;
  };

  const currentPlan = getCurrentPlan();
  const activePlanName = getActivePlanName();
  const displayName = fullName || getFullName() || 'Usuário';
  const avatarUrl = userProfile?.avatar_url || getAvatarUrl();

  return (
    // ... O JSX inicial com os background elements permanece o mesmo ...
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
        <TrialTimer />
        {/* ... Background Elements ... */}
        <div className="container mx-auto px-4 py-8 relative z-10">
            {/* ... Header e Profile Overview Card permanecem os mesmos ... */}
            <div className="text-center mb-12">
                <div className="relative inline-block">
                    <AvatarUpload currentAvatarUrl={avatarUrl} onAvatarUpdate={handleAvatarUpdate} userName={displayName} />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">Meu Perfil</h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">Gerencie suas informações e personalize sua experiência</p>
            </div>
            <div className="max-w-5xl mx-auto space-y-8">
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
                    <CardHeader className="text-center pb-4">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Digite seu nome" className="bg-slate-700 border-slate-600 text-white" />
                                    <Button onClick={handleSaveName} size="sm">Salvar</Button>
                                    <Button onClick={() => setIsEditingName(false)} variant="outline" size="sm">Cancelar</Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-3xl text-white">{displayName}</CardTitle>
                                    <Button onClick={() => setIsEditingName(true)} variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></Button>
                                </div>
                            )}
                        </div>
                        <CardDescription className="text-lg text-slate-300">{user?.email}</CardDescription>
                    </CardHeader>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Subscription Information */}
                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white flex items-center gap-3">
                                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-pink-500" /></div>
                                Plano Atual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {hasAnyActivePlan() && activePlanName ? (
                                // ... (toda a lógica para mostrar o plano ativo permanece a mesma)
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            {activePlanName === 'Trial' && <Heart className="w-8 h-8 text-green-500" />}
                                            {activePlanName && activePlanName.toLowerCase().includes('text') && activePlanName.toLowerCase().includes('audio') && <Heart className="w-8 h-8 text-pink-500" />}
                                            <Badge variant="default" className={`text-xl px-6 py-2 font-bold shadow-lg ${activePlanName === 'Trial' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'}`}>
                                                {activePlanName}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6 text-center">
                                       {/* Conteúdo do plano ativo... */}
                                    </div>
                                </div>
                            ) : (
                                // MODIFICAÇÃO 1: Botão removido daqui
                                <div className="text-center py-8">
                                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-8">
                                        <div className="w-16 h-16 bg-slate-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                            <Heart className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-400 mb-6 text-lg">Nenhum plano ativo</p>
                                        {/* O BOTÃO "ESCOLHER PLANO" FOI REMOVIDO DESTA ÁREA */}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Information */}
                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
                        {/* ... (conteúdo do card de informações da conta permanece o mesmo) ... */}
                        <CardHeader>
                           <CardTitle className="text-2xl text-white flex items-center gap-3"><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><Mail className="w-6 h-6 text-blue-500" /></div>Informações da Conta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6">
                                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><Mail className="w-6 h-6 text-blue-500" /></div><div><p className="text-slate-400 text-sm">Email</p><p className="text-white text-lg font-medium">{user?.email}</p></div></div>
                            </div>
                            <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500 rounded-2xl p-6">
                                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-green-500" /></div><div><p className="text-slate-400 text-sm">Status da Conta</p><p className="text-green-400 text-lg font-medium">Verificada</p></div></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white flex items-center gap-3"><div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><User className="w-6 h-6 text-purple-500" /></div>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* MODIFICAÇÃO 2: O botão de Chat só aparece se houver um plano ativo */}
                            {hasAnyActivePlan() && (
                                <Button 
                                    onClick={handleGoToChat}
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