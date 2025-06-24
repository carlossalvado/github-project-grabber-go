
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from '@/hooks/useUserCache';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Save, RefreshCw } from 'lucide-react';
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
    <div className="min-h-screen bg-sweetheart-bg">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-isa mb-2">
            Meu Perfil
          </h1>
          <p className="text-isa-muted text-lg">
            Gerencie suas informações e personalize sua experiência
          </p>
        </div>

        {/* User Info Card */}
        <Card className="card-isa">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar */}
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

              {/* User Name */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-isa-light">
                  {getFullName() || 'Usuário'}
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

              {currentPlanName === 'trial' && (
                <div className="text-center">
                  <p className="text-isa-muted text-sm mb-3">
                    Trial de 72 horas - Acesso completo por tempo limitado
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/plan'}
                    className="btn-isa-secondary w-full"
                  >
                    Trial ativo
                  </Button>
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
                onClick={() => window.location.href = '/chat-trial'}
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

      {/* Avatar Upload Component */}
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
