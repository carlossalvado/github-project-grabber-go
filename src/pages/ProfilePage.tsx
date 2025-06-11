
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, MessageCircle, LogOut, Edit } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchSelectedAgent();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const fetchSelectedAgent = async () => {
    try {
      const { data: userAgent, error: userAgentError } = await supabase
        .from('user_selected_agent')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (userAgentError && userAgentError.code !== 'PGRST116') {
        console.error('Erro ao buscar agente selecionado:', userAgentError);
        return;
      }

      if (userAgent) {
        const { data: agent, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', userAgent.agent_id)
          .single();

        if (agentError) {
          console.error('Erro ao buscar dados do agente:', agentError);
          return;
        }

        setSelectedAgent({
          ...agent,
          nickname: userAgent.nickname
        });
      }
    } catch (error) {
      console.error('Erro ao buscar agente selecionado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.clear();
      navigate('/', { replace: true });
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const handleEditPersonalization = () => {
    navigate('/personalize', { 
      state: { from: 'profile' }
    });
  };

  const handleStartChat = () => {
    if (selectedAgent) {
      navigate('/chat');
    } else {
      toast.error('Selecione uma companhia primeiro');
      navigate('/personalize', { 
        state: { from: 'profile' }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Meu Perfil
          </h1>
          <p className="text-slate-300">
            Gerencie suas informações e preferências
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações do Usuário */}
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedAgent?.avatar_url} />
                  <AvatarFallback className="bg-pink-500/20 text-pink-500">
                    {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {userProfile?.full_name || 'Usuário'}
                  </h3>
                  <p className="text-slate-400">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-400">Status do Plano</p>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${userProfile?.plan_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white">
                    {userProfile?.plan_active ? userProfile?.plan_name || 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companhia Selecionada */}
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-pink-500" />
                </div>
                Sua Companhia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAgent ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-600">
                      <img
                        src={selectedAgent.avatar_url}
                        alt={selectedAgent.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {selectedAgent.nickname}
                      </h3>
                      <p className="text-slate-400">{selectedAgent.name}</p>
                      <p className="text-sm text-slate-500">{selectedAgent.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleStartChat}
                      className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversar
                    </Button>
                    <Button
                      onClick={handleEditPersonalization}
                      variant="outline"
                      className="border-pink-500/50 text-pink-300 hover:bg-pink-500/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">
                    Você ainda não selecionou uma companhia
                  </p>
                  <Button
                    onClick={handleEditPersonalization}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Personalizar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={handleEditPersonalization}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Editar Personalização
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
