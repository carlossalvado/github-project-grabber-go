
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
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-pink-500 mb-4">
            Meu Perfil
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Gerencie suas informações e preferências
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-pink-500" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xl text-white mb-2">Email</p>
                <p className="text-pink-500 text-lg">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-pink-500" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {currentPlan?.name === 'Ultimate' && <Crown className="w-6 h-6 text-pink-500" />}
                    {currentPlan?.name === 'Premium' && <Sparkles className="w-6 h-6 text-pink-500" />}
                    {currentPlan?.name === 'Basic' && <Heart className="w-6 h-6 text-pink-500" />}
                    <Badge 
                      variant="default" 
                      className="bg-pink-500 text-white text-lg px-4 py-2"
                    >
                      {userSubscription.plan_name || 'Plano Ativo'}
                    </Badge>
                  </div>
                  
                  <div className="bg-slate-700 border border-slate-600 rounded-xl p-6 text-center">
                    <p className="text-white mb-2">Status: 
                      <span className="ml-2 text-pink-500 font-semibold">
                        {userSubscription.status === 'active' ? 'Ativo' : userSubscription.status}
                      </span>
                    </p>
                    
                    {currentPlan && (
                      <div className="mt-4">
                        <p className="text-pink-500 text-lg font-semibold">
                          R$ {currentPlan.price}/mês
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          {currentPlan.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-slate-700 border border-slate-600 rounded-xl p-6">
                    <p className="text-slate-400 mb-4">Nenhum plano ativo</p>
                    <Button 
                      onClick={() => navigate('/')}
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      Escolher Plano
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/modern-chat')}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl"
                >
                  Ir para Chat
                </Button>
                
                <Button 
                  onClick={() => navigate('/personalize')}
                  className="flex-1 bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white py-3 rounded-xl"
                >
                  Personalizar
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex-1 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 rounded-xl"
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
