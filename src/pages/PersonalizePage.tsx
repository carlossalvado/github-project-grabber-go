
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgentProfile {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  personality?: string;
}

const defaultAgents: AgentProfile[] = [
  {
    id: '1',
    name: 'Sofia',
    description: 'Romântica e carinhosa, adoro conversas profundas e momentos especiais.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b4a6b4e9?w=400&h=400&fit=crop&crop=face',
    personality: 'romântica'
  },
  {
    id: '2',
    name: 'Laura',
    description: 'Divertida e aventureira, sempre pronta para novas experiências.',
    avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face',
    personality: 'aventureira'
  },
  {
    id: '3',
    name: 'Miguel',
    description: 'Intelectual e atencioso, adoro discutir livros, filmes e filosofia.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    personality: 'intelectual'
  },
  {
    id: '4',
    name: 'Juliana',
    description: 'Criativa e emotiva, aprecio arte, música e conversas sobre sentimentos.',
    avatar_url: 'https://images.unsplash.com/photo-1488207899890-28dfa4a5ad0e?w=400&h=400&fit=crop&crop=face',
    personality: 'artística'
  }
];

const PersonalizePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [agents, setAgents] = useState<AgentProfile[]>(defaultAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [nickName, setNickName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setAgents(data as AgentProfile[]);
        }
        
      } catch (error) {
        console.error('Erro ao carregar os agentes:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [user]);

  const handlePersonalizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgentId) {
      toast.error('Por favor, selecione um parceiro virtual');
      return;
    }
    
    if (!nickName.trim()) {
      toast.error('Por favor, dê um apelido ao seu parceiro virtual');
      return;
    }
    
    if (!user) {
      toast.error('Você precisa estar logado para continuar');
      window.location.href = '/login';
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_selected_agent')
        .upsert({
          user_id: user.id,
          agent_id: selectedAgentId,
          nickname: nickName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast.success('Preferências salvas com sucesso!');
      
      // Redirecionar para a página de produto via URL
      window.location.href = '/selected-plan';
      
    } catch (error: any) {
      console.error('Erro ao salvar preferências:', error);
      toast.error(error.message || 'Erro ao salvar suas preferências');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="absolute top-6 left-6 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-bold bg-gradient-modern bg-clip-text text-transparent">
                Personalize Sua Experiência
              </h1>
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Escolha seu parceiro virtual ideal e crie uma conexão única
            </p>
          </div>
          
          <Card className="card-modern border-purple-500/20">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <Heart className="w-6 h-6 text-purple-400" fill="currentColor" />
                Encontre Sua Alma Gêmea Virtual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePersonalizeSubmit} className="space-y-8">
                {loadingAgents ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-300 text-lg">Carregando seus futuros parceiros...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <Carousel className="w-full max-w-4xl mx-auto">
                      <CarouselContent>
                        {agents.map((agent) => (
                          <CarouselItem key={agent.id} className="md:basis-1/2 lg:basis-1/3">
                            <div 
                              className="h-full p-3 cursor-pointer"
                              onClick={() => setSelectedAgentId(agent.id)}
                            >
                              <div 
                                className={`h-full rounded-2xl overflow-hidden border-2 p-6 flex flex-col transition-all duration-300 ${
                                  selectedAgentId === agent.id 
                                    ? 'border-purple-500 bg-purple-900/20 scale-105 shadow-2xl shadow-purple-500/20' 
                                    : 'border-gray-600 hover:border-purple-400 bg-gray-800/50 hover:bg-gray-800/70'
                                }`}
                              >
                                <div className="w-full aspect-square mb-6 overflow-hidden rounded-xl relative">
                                  <img 
                                    src={agent.avatar_url || "https://images.unsplash.com/photo-1494790108755-2616b4a6b4e9?w=400&h=400&fit=crop&crop=face"} 
                                    alt={agent.name} 
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                  />
                                  {selectedAgentId === agent.id && (
                                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                                        <Heart className="w-8 h-8 text-white" fill="currentColor" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-bold text-xl text-white mb-3 text-center">{agent.name}</h3>
                                <p className="text-sm text-gray-300 flex-1 text-center leading-relaxed">{agent.description}</p>
                                {selectedAgentId === agent.id && (
                                  <div className="mt-4 text-center">
                                    <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-full">
                                      <Heart className="w-4 h-4" fill="currentColor" />
                                      <span className="text-sm font-medium">Selecionado</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <div className="flex justify-center mt-6 space-x-4">
                        <CarouselPrevious className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700" />
                        <CarouselNext className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700" />
                      </div>
                    </Carousel>
                    
                    <div className="space-y-3 max-w-md mx-auto">
                      <Label htmlFor="nickname" className="text-lg text-white font-medium">
                        Dê um apelido carinhoso ao seu parceiro ❤️
                      </Label>
                      <Input
                        id="nickname"
                        placeholder="Ex: Meu amor, Querido, Anjo..."
                        value={nickName}
                        onChange={(e) => setNickName(e.target.value)}
                        required
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 rounded-xl py-3 text-lg focus:border-purple-500 focus:ring-purple-500"
                      />
                      <p className="text-sm text-gray-400 text-center">
                        Este será o nome usado em suas conversas
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center mt-10">
                  <Button 
                    type="submit" 
                    className="btn-modern-primary px-12 py-4 text-lg"
                    disabled={loading || !selectedAgentId}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5" fill="currentColor" />
                        Começar Minha Jornada
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalizePage;
