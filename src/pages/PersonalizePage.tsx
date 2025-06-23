import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, ArrowRight, Sparkles, MessageCircle, User, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserCache } from '@/hooks/useUserCache';
import { useTrialManager } from '@/hooks/useTrialManager';

const PersonalizePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPlanActive } = useUserCache();
  const { startTrial } = useTrialManager();
  const [selectedPersonality, setSelectedPersonality] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [nickname, setNickname] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Verificar se o usuário tem plano ativo
  const hasActivePlan = hasPlanActive();

  useEffect(() => {
    // Recuperar dados do usuário e plano do cache
    const cachedUserData = localStorage.getItem('userData');
    if (cachedUserData) {
      try {
        const data = JSON.parse(cachedUserData);
        setUserData(data);
      } catch (error) {
        console.error('Erro ao recuperar dados do usuário:', error);
      }
    }

    // Buscar avatares do Supabase
    fetchAvatars();
    // Carregar dados de personalização existentes se houver
    loadExistingPersonalization();
  }, []);

  const fetchAvatars = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar avatares:', error);
        toast.error('Erro ao carregar avatares');
        return;
      }

      setAiAgents(data || []);
    } catch (error) {
      console.error('Erro ao buscar avatares:', error);
      toast.error('Erro ao carregar avatares');
    }
  };

  const loadExistingPersonalization = async () => {
    if (!user) return;

    try {
      // Buscar agente selecionado
      const { data: agentData, error: agentError } = await supabase
        .from('user_selected_agent')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (agentData && !agentError) {
        setSelectedAvatar(agentData.agent_id);
        setNickname(agentData.nickname);
      }

      // Carregar outros dados de personalização do cache se existirem
      const cachedData = localStorage.getItem('userData');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        if (data.personality) setSelectedPersonality(data.personality);
        if (data.interests) setSelectedInterests(data.interests);
      }
    } catch (error) {
      console.error('Erro ao carregar personalização existente:', error);
    }
  };

  const personalities = [
    {
      id: 'romantic',
      name: 'Romântica',
      description: 'Carinhosa, sensível e apaixonada'
    },
    {
      id: 'playful',
      name: 'Divertida',
      description: 'Brincalhona, espontânea e alegre'
    },
    {
      id: 'intelligent',
      name: 'Intelectual',
      description: 'Curiosa, profunda e inteligente'
    },
    {
      id: 'adventurous',
      name: 'Aventureira',
      description: 'Corajosa, exploradora e ousada'
    }
  ];

  const interests = [
    'Música', 'Filmes', 'Livros', 'Viagens', 'Culinária', 
    'Arte', 'Esportes', 'Tecnologia', 'Natureza', 'Fotografia'
  ];

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const savePersonalization = async () => {
    if (!selectedPersonality || !selectedAvatar || !nickname.trim()) {
      toast.error('Por favor, complete todas as seleções');
      return;
    }

    setLoading(true);

    try {
      // Salvar agente selecionado no Supabase
      if (user && selectedAvatar) {
        const { error } = await supabase
          .from('user_selected_agent')
          .upsert({
            user_id: user.id,
            agent_id: selectedAvatar,
            nickname: nickname.trim(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Erro ao salvar agente selecionado:', error);
          toast.error('Erro ao salvar personalização');
          return;
        }
      }

      // Salvar personalização no cache
      const personalizationData = {
        personality: selectedPersonality,
        interests: selectedInterests,
        selectedAvatar,
        nickname: nickname.trim(),
        personalizationCompleted: true
      };
      
      // Atualizar dados do usuário no cache
      const updatedUserData = {
        ...userData,
        ...personalizationData
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      toast.success('Personalização salva com sucesso!');
      
      // Voltar para o perfil
      navigate('/profile');
    } catch (error) {
      console.error('Erro ao salvar personalização:', error);
      toast.error('Erro ao salvar personalização');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedPersonality || !selectedAvatar || !nickname.trim()) {
      toast.error('Por favor, complete todas as seleções');
      return;
    }

    setLoading(true);

    try {
      // Salvar personalização no cache
      const personalizationData = {
        personality: selectedPersonality,
        interests: selectedInterests,
        selectedAvatar,
        nickname: nickname.trim(),
        personalizationCompleted: true
      };
      
      // Atualizar dados do usuário no cache
      const updatedUserData = {
        ...userData,
        ...personalizationData
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Salvar no Supabase se possível
      if (user && selectedAvatar) {
        try {
          const { error } = await supabase
            .from('user_selected_agent')
            .upsert({
              user_id: user.id,
              agent_id: selectedAvatar,
              nickname: nickname.trim(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error('Erro ao salvar agente selecionado:', error);
          }
        } catch (error) {
          console.error('Erro ao salvar no Supabase:', error);
        }
      }
      
      // Verificar se é plano trial ou pago
      const isTrialPlan = userData?.selectedPlan?.name?.toLowerCase().includes('trial');
      
      if (isTrialPlan) {
        // Para trial, iniciar o trial e ir para o profile
        console.log('🚀 Iniciando trial para o usuário...');
        const trialStarted = await startTrial();
        
        if (trialStarted) {
          console.log('✅ Trial iniciado com sucesso!');
          // Salvar informações do trial no cache
          const trialUserData = {
            ...updatedUserData,
            selectedPlan: {
              ...userData.selectedPlan,
              plan_active: true,
              trial_active: true
            }
          };
          localStorage.setItem('userData', JSON.stringify(trialUserData));
          
          toast.success('Trial iniciado! Bem-vindo ao trial de 72 horas!');
          navigate('/profile');
        } else {
          console.error('❌ Erro ao iniciar trial');
          toast.error('Erro ao iniciar trial');
        }
      } else {
        // Para planos pagos, ir para a página do produto único (SinglePlanCard)
        const selectedPlanId = localStorage.getItem('selectedPlanId');
        if (selectedPlanId) {
          navigate(`/plan/${selectedPlanId}`);
        } else {
          // Fallback - ir para home se não tiver plano ID
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Erro ao processar personalização:', error);
      toast.error('Erro ao salvar personalização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Quadrante Superior Esquerdo */}
      <div className="absolute top-8 left-8 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-20 left-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-32 left-16 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1000">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-44 left-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-1500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-56 left-12 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-2000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Superior Direito */}
      <div className="absolute top-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-500">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-24 right-32 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-1000">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-40 right-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-12 right-48 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-2000">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-52 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Inferior Esquerdo */}
      <div className="absolute bottom-8 left-8 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-1000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-20 left-32 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-32 left-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-7 animate-pulse delay-2000">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-44 left-40 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-5 animate-pulse delay-2500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-56 left-12 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-9 animate-pulse delay-3000">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Inferior Direito */}
      <div className="absolute bottom-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-20 right-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-2000">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-36 right-16 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-2500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-52 right-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-7 animate-pulse delay-3000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-64 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-3500">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full overflow-hidden opacity-40">
              <img 
                src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
                alt="AI Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Personalize sua Experiência
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Ajude-nos a criar a companhia virtual perfeita para você
          </p>
          {userData?.selectedPlan && (
            <div className="mt-4 inline-block px-4 py-2 bg-pink-500/20 rounded-full border border-pink-500/30">
              <span className="text-pink-300 font-medium">
                Plano selecionado: {userData.selectedPlan.name}
              </span>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Avatar Selection */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                Escolha sua Companhia
              </CardTitle>
              <CardDescription className="text-slate-300">
                Selecione com quem você gostaria de conversar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {aiAgents.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedAvatar === agent.id
                        ? 'bg-pink-500/20 border-pink-500/50 shadow-lg'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50'
                    }`}
                    onClick={() => setSelectedAvatar(agent.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <img
                        src={agent.avatar_url}
                        alt={agent.name}
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                      />
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {agent.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-white">
                  Como você gostaria de ser chamado(a)?
                </Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Digite seu apelido..."
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personality Selection */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                Escolha a Personalidade
              </CardTitle>
              <CardDescription className="text-slate-300">
                Selecione o tipo de personalidade que mais te atrai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalities.map((personality) => (
                  <Card
                    key={personality.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedPersonality === personality.id
                        ? 'bg-pink-500/20 border-pink-500/50 shadow-lg'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50'
                    }`}
                    onClick={() => setSelectedPersonality(personality.id)}
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {personality.name}
                      </h3>
                      <p className="text-slate-300 text-sm">
                        {personality.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests Selection */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-500" />
                </div>
                Seus Interesses
              </CardTitle>
              <CardDescription className="text-slate-300">
                Selecione os tópicos que você gosta de conversar (máximo 5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {interests.map((interest) => (
                  <Button
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInterestToggle(interest)}
                    disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 5}
                    className={`${
                      selectedInterests.includes(interest)
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent'
                        : 'border-pink-500/50 text-pink-300 hover:bg-pink-500/20 hover:text-pink-200'
                    } transition-all duration-300`}
                  >
                    {interest}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-slate-400 mt-4">
                {selectedInterests.length}/5 interesses selecionados
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center">
            {hasActivePlan ? (
              <Button
                onClick={savePersonalization}
                disabled={!selectedPersonality || !selectedAvatar || !nickname.trim() || selectedInterests.length === 0 || loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-4 text-lg rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            ) : (
              <Button
                onClick={handleContinue}
                disabled={!selectedPersonality || !selectedAvatar || !nickname.trim() || selectedInterests.length === 0 || loading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-4 text-lg rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {loading ? 'Processando...' : userData?.selectedPlan?.name?.toLowerCase().includes('trial') ? 'Finalizar Trial' : 'Continuar para Pagamento'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizePage;
