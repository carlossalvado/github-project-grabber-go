import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Save, RefreshCw, Loader2, MessageCircle } from 'lucide-react';
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

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Erro no logout:', error);
    }
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    const success = await updateAvatar(avatarUrl);
    if (success) {
      setShowAvatarUpload(false);
    }
  };

  const handleRefreshData = () => {
    fetchUserData(true);
    toast.info('Atualizando dados...');
  };

  // ✅ LÓGICA DE NAVEGAÇÃO FINAL, BASEADA NA PRIORIDADE
  const handleNavigateToChat = () => {
    const planIsActive = hasPlanActive();
    const trialIsActive = isTrialActive();

    // Regra 1: Se o plano pago estiver ativo, ele tem prioridade máxima.
    if (planIsActive) {
      navigate('/chat-text-audio');
      return; // Encerra a função aqui
    }

    // Regra 2: Se não tem plano pago, mas tem trial ativo.
    if (trialIsActive) {
      navigate('/chat-trial');
      return; // Encerra a função aqui
    }

    // Regra 3: Se não tem nenhum dos dois (não deve acontecer se o botão estiver desabilitado).
    toast.info('Nenhum plano ativo encontrado para acessar o chat.');
  };

  // Variáveis para controle da UI
  const planIsActive = hasPlanActive();
  const trialIsActive = isTrialActive();
  const canAccessChat = planIsActive || trialIsActive; // O usuário pode acessar o chat se tiver um dos dois

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

  return (
    <div className="min-h-screen bg-sweetheart-bg">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* ... (código do Header, User Info Card, etc - sem alterações) ... */}
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

        {/* Plan Information & Account Information */}
        <div className="grid md:grid-cols-2 gap-6">
           <Card className="card-isa">
            <CardHeader>
              <CardTitle className="text-isa-pink flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-isa-pink to-isa-purple rounded"></div>
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {planIsActive && (
                    <div className="bg-isa-card/50 p-4 rounded-lg border border-isa-purple/30">
                        <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="px-3 py-1 bg-isa-purple/20 text-isa-purple rounded-full text-sm font-medium">
                                    {getPlanName()}
                                </span>
                            </div>
                            <p className="text-sm text-isa-muted mt-2">
                                Status: <span className="text-green-400 font-medium">Ativo</span>
                            </p>
                        </div>
                        </div>
                    </div>
                )}
                {isTrialActive() && (
                    <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <span className="text-orange-400 font-medium">Trial Ativo</span>
                    </div>
                    <p className="text-sm text-isa-muted">
                        {getTrialHoursRemaining() > 0 ? `${getTrialHoursRemaining()} horas restantes` : 'Expirando em breve'}
                    </p>
                    </div>
                )}
                {!planIsActive && !isTrialActive() && (
                    <p className="text-isa-muted text-center">Você não possui um plano ou trial ativo.</p>
                )}
            </CardContent>
          </Card>
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

        {/* ... (código de Personal Information - sem alterações) ... */}
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

        {/* Quick Actions - Ações Rápidas */}
        <Card className="card-isa">
          <CardHeader>
            <CardTitle className="text-isa-pink flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-isa-pink to-red-500 rounded"></div>
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleNavigateToChat}
              disabled={!canAccessChat} // O botão é desabilitado se o usuário não tiver acesso
              className="btn-isa-primary flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Ir para Chat
            </Button>

            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              Sair da Conta
            </Button>
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