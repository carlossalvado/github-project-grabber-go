
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Crown, Calendar, Settings, LogOut, Heart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { userSubscription } = useSubscription();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Meu Perfil
          </h1>
          <p className="text-lg text-gray-300">
            Gerencie sua conta e preferências
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <User className="w-6 h-6 text-purple-400" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-gray-300">
                Seus dados da conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Email
                </Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-700/50 border-slate-600/50 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Membro desde
                </Label>
                <Input
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  disabled
                  className="bg-slate-700/50 border-slate-600/50 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-purple-400" />
                Assinatura
              </CardTitle>
              <CardDescription className="text-gray-300">
                Status do seu plano atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Plano Atual:</span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {userSubscription.plan_name}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Status:</span>
                    <Badge 
                      variant={userSubscription.status === 'active' ? 'default' : 'secondary'}
                      className={userSubscription.status === 'active' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-white'
                      }
                    >
                      {userSubscription.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {userSubscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Próxima cobrança:</span>
                      <span className="text-gray-300">
                        {new Date(userSubscription.current_period_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-600/50">
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Alterar Plano
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Nenhum plano ativo</p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Escolher Plano
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-400" />
                Ações da Conta
              </CardTitle>
              <CardDescription className="text-gray-300">
                Gerencie sua conta e preferências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate('/personalize')}
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Personalizar
                </Button>

                <Button
                  onClick={() => navigate('/modern-chat')}
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <User className="w-4 h-4 mr-2" />
                  Conversar
                </Button>

                <Button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      Saindo...
                    </div>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </>
                  )}
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
