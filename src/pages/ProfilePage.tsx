
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    plan_name: string | null;
    plan_active: boolean | null;
  } | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, plan_name, plan_active')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        toast.error("Não foi possível carregar seus dados");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      toast.error("Erro ao sair da conta");
    }
  };
  
  const handleChatNavigation = () => {
    // Navegar diretamente para o chat sem verificações adicionais
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-sweetheart-light/20 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-sweet text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                <User size={64} className="text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold">Meu Perfil</CardTitle>
            <CardDescription className="text-white/90 text-center">
              Visualize e gerencie suas informações
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-pink-500 rounded-full"></div>
                  <p className="mt-4 text-gray-600">Carregando seus dados...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-600">Nome:</h3>
                    <p className="text-lg">{profile?.full_name || user?.user_metadata?.full_name || 'Não disponível'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-600">Email:</h3>
                    <p className="text-lg">{user?.email || 'Não disponível'}</p>
                  </div>
                  
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-600">Plano atual:</h3>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        (profile?.plan_active || userSubscription?.status === 'active') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userSubscription?.plan_name || profile?.plan_name || 'Nenhum plano ativo'}
                      </span>
                    </div>
                  </div>
                  
                  {(userSubscription || profile?.plan_active) && (
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-600">Status:</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        (profile?.plan_active || userSubscription?.status === 'active') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(profile?.plan_active || userSubscription?.status === 'active') ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              className="w-full bg-gradient-sweet flex items-center gap-2" 
              onClick={handleChatNavigation}
            >
              <MessageCircle size={18} />
              Ir para o Chat
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
              onClick={handleSignOut}
            >
              Sair da conta
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
