import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import AvatarUpload from '@/components/AvatarUpload';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    profile,
    loading,
    error,
    fetchUserData,
    updateProfile,
    updateAvatar,
    getFullName,
    getAvatarUrl,
    getPlanName,
    hasPlanActive,
    isTrialActive,
    getTrialHoursRemaining
  } = useUserProfile();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  useEffect(() => {
    fetchUserData(true);
  }, [fetchUserData]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const success = await updateProfile({ full_name: fullName.trim() });
      if (success) {
        toast.success('Perfil salvo com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    const success = await updateAvatar(avatarUrl);
    if (success) {
      setShowAvatarUpload(false);
      toast.success('Avatar atualizado com sucesso!');
    }
  };

  const handleRefreshData = () => {
    fetchUserData(true);
    toast.info('Atualizando dados...');
  };

  // Versão final e correta da função de navegação
  const handleNavigateToChat = () => {
    const trialActive = isTrialActive();
    const planActive = hasPlanActive();

    // Console.log para a verificação final
    console.log("--- Depuração Final ---");
    console.log("Resultado de isTrialActive():", trialActive);
    console.log("Resultado de hasPlanActive():", planActive);

    if (trialActive) {
      // Se isTrialActive() é true, o hook JÁ GARANTIU que não há plano pago.
      console.log("DECISÃO: Usuário em TRIAL. Redirecionando para /chat-trial");
      navigate('/chat-trial');
    } else if (planActive) {
      // Se chegou aqui, trialActive é falso. Verificamos se há um plano ativo.
      console.log("DECISÃO: Usuário com PLANO PAGO. Redirecionando para /chat-text-audio");
      navigate('/chat-text-audio');
    } else {
      // Se não caiu em nenhum dos casos acima, o usuário não tem acesso.
      console.log("DECISÃO: Usuário sem acesso.");
      toast.info('Você não possui um plano ou trial ativos para acessar o chat.');
    }
    console.log("--- Fim da Depuração Final ---");
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p className="text-slate-300">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center">
        <Card className="card-isa max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-400 mb-4">Erro ao carregar perfil: {error}</p>
            <Button onClick={handleRefreshData} className="btn-isa-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlanName = getPlanName();
  const currentPlanActive = hasPlanActive();
  const trialHours = getTrialHoursRemaining();

  return (
    <div className="min-h-screen bg-sweetheart-bg">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gradient-isa">
              Meu Perfil
            </h1>
            <Button
              onClick={handleRefreshData}
              variant="ghost"
              size="sm"
              className="text-isa-purple hover:text-isa-pink"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-isa-muted text-lg">
            Gerencie suas informações e personalize sua experiência
          </p>
        </div>

        {/* User Info Card */}
        <Card className="card-isa">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar
                  className="w-20 h-20 cursor-pointer border-2 border-isa-purple hover:border-isa-pink transition-colors"
                  onClick={() => setShowAvatarUpload(true)}
                >
                  <AvatarImage
                    src={getAvatarUrl() || undefined}
                    alt="Avatar do usuário"
                  />
                  <AvatarFallback className="bg-isa-card text-isa-light text-xl">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0 bg-isa-purple hover:bg-isa-pink border-isa-purple"
                  onClick={() => setShowAvatarUpload(true)}
                >
                  <Camera className="w-3 h-3 text-white" />
                </Button>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-isa-light">
                  {getFullName()}
                </h2>
                <p className="text-isa-muted">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Information */}
          <Card className="card-isa">
            <CardHeader>
              <CardTitle className="text-isa-pink flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-isa-pink to-isa-purple rounded"></div>
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-isa-card/50 p-4 rounded-lg border border-isa-purple/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {currentPlanActive && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                      <span className="px-3 py-1 bg-isa-purple/20 text-isa-purple rounded-full text-sm font-medium">
                        {currentPlanName}
                      </span>
                    </div>
                    <p className="text-sm text-isa-muted mt-2">
                      Status: {currentPlanActive ?
                        <span className="text-green-400 font-medium">Ativo</span> :
                        <span className="text-yellow-400 font-medium">Inativo</span>
                      }
                    </p>
                  </div>
                </div>
              </div>

              {!currentPlanActive && isTrialActive() && (
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-orange-400 font-medium">Trial Ativo</span>
                  </div>
                  <p className="text-sm text-isa-muted">
                    {trialHours > 0 ? `${trialHours} horas restantes` : 'Expirando em breve'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="card-isa">
            <CardHeader>
              <CardTitle className="text-isa-light flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-isa-purple rounded"></div>
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-isa-card/50 p-3 rounded-lg border border-isa-purple/20">
                  <p className="text-xs text-isa-muted mb-1">Email</p>
                  <p className="text-isa-light font-medium">{user?.email}</p>
                </div>

                <div className="bg-isa-card/50 p-3 rounded-lg border border-isa-purple/20">
                  <p className="text-xs text-isa-muted mb-1">Status da Conta</p>
                  <p className="text-green-400 font-medium">Verificada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <Card className="card-isa">
          <CardHeader>
            <CardTitle className="text-isa-light">Informações Pessoais</CardTitle>
            <CardDescription className="text-isa-muted">
              Atualize suas informações básicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-isa-light">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="input-isa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-isa-light">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="input-isa bg-isa-card/50"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving || loading}
              className="btn-isa-primary w-full"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Perfil
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-isa">
          <CardHeader>
            <CardTitle className="text-isa-pink flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-isa-pink to-red-500 rounded"></div>
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleNavigateToChat}
                className="btn-isa-primary flex items-center justify-center gap-2"
              >
                Ir para Chat
              </Button>

              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
              >
                Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAvatarUpload && (
        <AvatarUpload
          currentAvatarUrl={getAvatarUrl()}
          onAvatarUpdate={handleAvatarUpdate}
          userName={getFullName()}
        />
      )}
    </div>
  );
};

export default ProfilePage;