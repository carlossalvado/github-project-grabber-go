
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Sparkles, MessageCircle, ArrowRight, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PersonalizePage = () => {
  const navigate = useNavigate();
  const [selectedPersonality, setSelectedPersonality] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentName, setAgentName] = useState<string>('');
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      setAgents(data || []);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      toast.error('Erro ao carregar agentes disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const personalities = [
    { id: 'romantic', name: 'Romântica', description: 'Carinhosa e apaixonada', icon: '💕' },
    { id: 'playful', name: 'Divertida', description: 'Alegre e brincalhona', icon: '😄' },
    { id: 'mysterious', name: 'Misteriosa', description: 'Intrigante e sedutora', icon: '😏' },
    { id: 'sweet', name: 'Doce', description: 'Meiga e acolhedora', icon: '🥰' },
    { id: 'confident', name: 'Confiante', description: 'Segura e determinada', icon: '😎' },
    { id: 'intellectual', name: 'Intelectual', description: 'Sábia e curiosa', icon: '🤓' }
  ];

  const interests = [
    'Música', 'Cinema', 'Literatura', 'Viagens', 'Culinária', 'Arte',
    'Esportes', 'Tecnologia', 'Natureza', 'Dança', 'Fotografia', 'Jogos'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    if (selectedPersonality && selectedInterests.length > 0 && selectedAgent && agentName.trim()) {
      // Salvar seleções no localStorage
      localStorage.setItem('selectedAgent', JSON.stringify(selectedAgent));
      localStorage.setItem('agentName', agentName);
      localStorage.setItem('selectedPersonality', selectedPersonality);
      localStorage.setItem('selectedInterests', JSON.stringify(selectedInterests));
      
      navigate('/modern-chat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-3 w-3 bg-pink-500 rounded-full mx-1"></div>
          <div className="h-3 w-3 bg-pink-500 rounded-full mx-1 mt-1"></div>
          <div className="h-3 w-3 bg-pink-500 rounded-full mx-1 mt-1"></div>
          <p className="text-pink-500 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Top Section - Floating Images */}
      <div className="absolute top-8 right-8 w-12 h-12 rounded-full overflow-hidden opacity-8 animate-pulse">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-16 right-32 w-10 h-10 rounded-full overflow-hidden opacity-6 animate-pulse delay-500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-6 right-64 w-14 h-14 rounded-full overflow-hidden opacity-7 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-24 right-96 w-8 h-8 rounded-full overflow-hidden opacity-5 animate-pulse delay-1500">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-4 right-[28rem] w-12 h-12 rounded-full overflow-hidden opacity-9 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Bottom Section - Floating Images */}
      <div className="absolute bottom-8 left-8 w-14 h-14 rounded-full overflow-hidden opacity-9 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-16 left-32 w-10 h-10 rounded-full overflow-hidden opacity-7 animate-pulse delay-1500">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-6 left-64 w-12 h-12 rounded-full overflow-hidden opacity-8 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-24 left-96 w-16 h-16 rounded-full overflow-hidden opacity-6 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-4 left-[28rem] w-8 h-8 rounded-full overflow-hidden opacity-7 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Left Side - Floating Images */}
      <div className="absolute top-1/4 left-4 w-10 h-10 rounded-full overflow-hidden opacity-6 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/2 left-12 w-14 h-14 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-2/3 left-6 w-12 h-12 rounded-full overflow-hidden opacity-7 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Right Side - Floating Images */}
      <div className="absolute top-1/4 right-4 w-12 h-12 rounded-full overflow-hidden opacity-9 animate-pulse delay-3500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/2 right-12 w-8 h-8 rounded-full overflow-hidden opacity-5 animate-pulse delay-4000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-2/3 right-6 w-16 h-16 rounded-full overflow-hidden opacity-8 animate-pulse delay-4500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Additional Middle Floating Images */}
      <div className="absolute top-32 left-1/3 w-8 h-8 rounded-full overflow-hidden opacity-6 animate-pulse delay-5000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-32 right-1/3 w-10 h-10 rounded-full overflow-hidden opacity-7 animate-pulse delay-5500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-40 left-1/2 w-6 h-6 rounded-full overflow-hidden opacity-5 animate-pulse delay-6000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-40 left-1/2 w-12 h-12 rounded-full overflow-hidden opacity-8 animate-pulse delay-6500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-48 right-1/2 w-14 h-14 rounded-full overflow-hidden opacity-6 animate-pulse delay-7000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-pink-500 mb-4">
            Personalize Sua Experiência
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Conte-nos mais sobre você para criarmos a companhia virtual perfeita
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Agent Selection */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <User className="w-6 h-6 text-pink-500" />
                Escolha Seu Agente
              </CardTitle>
              <CardDescription className="text-slate-400">
                Selecione a aparência do seu agente virtual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedAgent?.id === agent.id
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-slate-600 hover:border-pink-400/50 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="text-center">
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.name}
                        className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                      />
                      <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                      <p className="text-sm text-slate-400">{agent.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedAgent && (
                <div className="space-y-4">
                  <Label htmlFor="agentName" className="text-white">
                    Como você gostaria de chamar seu agente?
                  </Label>
                  <Input
                    id="agentName"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Digite um nome personalizado"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personality Selection */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500" />
                Personalidade Ideal
              </CardTitle>
              <CardDescription className="text-slate-400">
                Escolha o tipo de personalidade que mais te atrai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalities.map((personality) => (
                  <div
                    key={personality.id}
                    onClick={() => setSelectedPersonality(personality.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPersonality === personality.id
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-slate-600 hover:border-pink-400/50 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{personality.icon}</div>
                      <h3 className="text-lg font-semibold text-white mb-1">{personality.name}</h3>
                      <p className="text-sm text-slate-400">{personality.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests Selection */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-pink-500" />
                Interesses em Comum
              </CardTitle>
              <CardDescription className="text-slate-400">
                Selecione seus interesses para conversas mais interessantes (mínimo 3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "secondary"}
                    className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 ${
                      selectedInterests.includes(interest)
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              {selectedInterests.length > 0 && (
                <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-pink-500">
                    Selecionados: {selectedInterests.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedPersonality || selectedInterests.length < 3 || !selectedAgent || !agentName.trim()}
              className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
                selectedPersonality && selectedInterests.length >= 3 && selectedAgent && agentName.trim()
                  ? 'bg-pink-500 hover:bg-pink-600 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                Começar Conversa
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
            {(!selectedPersonality || selectedInterests.length < 3 || !selectedAgent || !agentName.trim()) && (
              <p className="text-sm text-slate-400 mt-2">
                Complete sua personalização para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizePage;
