
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from '@/hooks/useUserCache';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Save, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import AvatarUpload from '@/components/AvatarUpload';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { profile, plan, getFullName, getAvatarUrl, getPlanName, hasPlanActive, loadFromCache } = useUserCache();
  const { saveToSupabase } = useSupabaseSync();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  // Escutar atualizações do plano após pagamento
  useEffect(() => {
    const handlePlanUpdate = (event: any) => {
      console.log('📱 ProfilePage: Plano atualizado via evento:', event.detail);
      // Recarregar cache para garantir dados atualizados
      loadFromCache();
      toast.success('✅ Plano atualizado com sucesso!');
    };

    window.addEventListener('planUpdated', handlePlanUpdate);
    
    return () => {
      window.removeEventListener('planUpdated', handlePlanUpdate);
    };
  }, [loadFromCache]);

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        id: user.id,
        full_name: fullName.trim(),
        email: user.email || '',
        plan_name: getPlanName(),
        plan_active: hasPlanActive()
      };

      await saveToSupabase('profile', profileData);
      toast.success('Perfil salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setLoading(false);
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

  const handleAvatarUpdate = (avatarUrl: string) => {
    setShowAvatarUpload(false);
    loadFromCache(); // Reload cache to get updated avatar
    toast.success('Avatar atualizado com sucesso!');
  };

  const currentPlanName = getPlanName() || 'Nenhum plano ativo';
  const currentPlanActive = hasPlanActive();

  return (
    <div className="min-h-screen bg-sweetheart-bg p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient-isa mb-2">
            Meu Perfil
          </h1>
          <p className="text-isa-muted">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>

        {/* Avatar Section */}
        <Card className="card-isa">
          <CardHeader className="text-center">
            <CardTitle className="text-isa-light">Foto do Perfil</CardTitle>
            <CardDescription className="text-isa-muted">
              Clique na foto para alterar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative inline-block">
              <Avatar 
                className="w-24 h-24 mx-auto cursor-pointer border-2 border-isa-purple hover:border-isa-pink transition-colors"
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
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-isa-purple hover:bg-isa-pink border-isa-purple"
                onClick={() => setShowAvatarUpload(true)}
              >
                <Camera className="w-4 h-4 text-white" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
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
              disabled={loading}
              className="btn-isa-primary w-full"
            >
              {loading ? (
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

        {/* Plan Information */}
        <Card className="card-isa">
          <CardHeader>
            <CardTitle className="text-isa-light">Plano Atual</CardTitle>
            <CardDescription className="text-isa-muted">
              Informações sobre sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-isa-card rounded-lg border border-isa-purple/30">
              <div>
                <p className="font-semibold text-isa-light">{currentPlanName}</p>
                <p className="text-sm text-isa-muted">
                  Status: {currentPlanActive ? 
                    <span className="text-green-400">Ativo</span> : 
                    <span className="text-yellow-400">Inativo</span>
                  }
                </p>
              </div>
              {currentPlanActive && (
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>

            {currentPlanName === 'trial' && (
              <div className="text-center">
                <Button 
                  onClick={() => window.location.href = '/plan'}
                  className="btn-isa-secondary"
                >
                  Fazer Upgrade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="card-isa">
          <CardContent className="pt-6">
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

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-isa-dark border border-isa-purple/30 rounded-lg p-6 w-full max-w-md relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-isa-muted hover:text-isa-white"
              onClick={() => setShowAvatarUpload(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <h3 className="text-lg font-semibold text-isa-light mb-4 text-center">
              Alterar Foto do Perfil
            </h3>
            
            <AvatarUpload 
              currentAvatarUrl={getAvatarUrl()}
              onAvatarUpdate={handleAvatarUpdate}
              userName={getFullName()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
