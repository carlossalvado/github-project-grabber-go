
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, CreditCard, Calendar, Sparkles, Crown, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { userSubscription, plans } = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getCurrentPlan = () => {
    if (!userSubscription) return null;
    return userSubscription.plan || plans.find(plan => plan.id === userSubscription.plan_id);
  };

  const currentPlan = getCurrentPlan();

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
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Meu Perfil
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Gerencie suas informações e preferências
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Information */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-purple-400" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xl text-white mb-2">Email</p>
                <p className="text-purple-300 text-lg">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-purple-400" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {currentPlan?.name === 'Ultimate' && <Crown className="w-6 h-6 text-yellow-400" />}
                    {currentPlan?.name === 'Premium' && <Sparkles className="w-6 h-6 text-purple-400" />}
                    {currentPlan?.name === 'Basic' && <Heart className="w-6 h-6 text-pink-400" />}
                    <Badge 
                      variant="default" 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-4 py-2"
                    >
                      {userSubscription.plan_name || 'Plano Ativo'}
                    </Badge>
                  </div>
                  
                  <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6 text-center">
                    <p className="text-white mb-2">Status: 
                      <span className="ml-2 text-green-400 font-semibold">
                        {userSubscription.status === 'active' ? 'Ativo' : userSubscription.status}
                      </span>
                    </p>
                    
                    {currentPlan && (
                      <div className="mt-4">
                        <p className="text-purple-300 text-lg font-semibold">
                          R$ {currentPlan.price}/mês
                        </p>
                        <p className="text-white/80 text-sm mt-2">
                          {currentPlan.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6">
                    <p className="text-white/80 mb-4">Nenhum plano ativo</p>
                    <Button 
                      onClick={() => navigate('/')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-xl"
                    >
                      Escolher Plano
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/modern-chat')}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl"
                >
                  Ir para Chat
                </Button>
                
                <Button 
                  onClick={() => navigate('/personalize')}
                  variant="outline"
                  className="flex-1 border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white py-3 rounded-xl"
                >
                  Personalizar
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex-1 border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white py-3 rounded-xl"
                >
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
