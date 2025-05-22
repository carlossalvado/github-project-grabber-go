import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
    avatar_url: 'https://i.imgur.com/8Km9tLL.jpg',
    personality: 'romântica'
  },
  {
    id: '2',
    name: 'Laura',
    description: 'Divertida e aventureira, sempre pronta para novas experiências.',
    avatar_url: 'https://i.imgur.com/6YQ5Coc.jpg',
    personality: 'aventureira'
  },
  {
    id: '3',
    name: 'Miguel',
    description: 'Intelectual e atencioso, adoro discutir livros, filmes e filosofia.',
    avatar_url: 'https://i.imgur.com/7GLk5j5.jpg',
    personality: 'intelectual'
  },
  {
    id: '4',
    name: 'Juliana',
    description: 'Criativa e emotiva, aprecio arte, música e conversas sobre sentimentos.',
    avatar_url: 'https://i.imgur.com/JR7aRCj.jpg',
    personality: 'artística'
  }
];

const SignupPage = () => {
  // Dados do usuário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);

  // Personalização
  const [agents, setAgents] = useState<AgentProfile[]>(defaultAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [nickName, setNickName] = useState<string>('');

  // Estados gerais
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [step, setStep] = useState(1); // 1: Cadastro, 2: Personalização
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const { signUp, user } = useAuth();
  const { plans, selectPlan } = useSubscription();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Recuperar o plano selecionado do localStorage
    const planId = localStorage.getItem('selectedPlanId');
    if (planId) {
      const planIdNum = parseInt(planId);
      setSelectedPlanId(planIdNum);
      
      // Buscar os detalhes do plano
      const plan = plans.find(p => p.id === planIdNum);
      if (plan) {
        console.log("Plano encontrado:", plan);
        setSelectedPlan(plan);
      }
    }
    
    // Carregar os agentes disponíveis
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
  }, [plans]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerms || !agreeAge) {
      toast.error('Você precisa concordar com os termos e confirmar sua idade.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Criar a conta do usuário
      await signUp(email, password, fullName);
      localStorage.setItem('userCountry', country);
      toast.success('Cadastro realizado com sucesso!');
      
      // Avançar para a etapa de personalização
      setStep(2);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

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
      setStep(1); // Voltar para o cadastro
      return;
    }
    
    setLoading(true);
    
    try {
      // Salvar a seleção do agente
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
      
      // Iniciar processo de checkout se tiver um plano selecionado
      if (selectedPlan) {
        console.log("Iniciando processo de checkout para o plano:", selectedPlan.name);
        
        // Processar seleção do plano e iniciar checkout do Stripe
        try {
          await selectPlan(selectedPlan.id);
          // O redirecionamento para o checkout acontecerá dentro da função selectPlan
        } catch (checkoutError: any) {
          console.error('Erro ao iniciar checkout:', checkoutError);
          toast.error(checkoutError.message || 'Erro ao processar o plano');
          // Se falhar o checkout, navegar para página de planos
          navigate('/plans');
        }
      } else {
        // Se não há plano selecionado, ir para a página de planos
        navigate('/plans');
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar preferências:', error);
      toast.error(error.message || 'Erro ao salvar suas preferências');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
      <div className={`w-full ${step === 2 ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
            {step === 1 ? 'Crie sua conta' : 'Personalize Sua Experiência'}
          </h1>
          <p className="text-gray-600">
            {step === 1 
              ? 'Comece sua jornada de relacionamento virtual' 
              : 'Escolha seu parceiro virtual e dê a ele um apelido carinhoso'}
          </p>
        </div>
        
        {step === 1 ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Cadastro</CardTitle>
              <CardDescription>
                Preencha seus dados para criar uma conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Digite seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Crie uma senha segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    placeholder="Seu país"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agreeTerms" 
                    checked={agreeTerms} 
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    Concordo com os <a href="#" className="text-blue-600 hover:underline">Termos de Serviço</a> e <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agreeAge" 
                    checked={agreeAge} 
                    onCheckedChange={(checked) => setAgreeAge(checked === true)}
                  />
                  <Label htmlFor="agreeAge" className="text-sm">
                    Confirmo que tenho pelo menos 18 anos de idade
                  </Label>
                </div>
                
                {selectedPlan && (
                  <div className="p-4 bg-gray-50 rounded-lg mt-4">
                    <p className="font-medium">Plano selecionado: {selectedPlan.name}</p>
                    <p className="text-gray-600 text-sm">{selectedPlan.description}</p>
                    <p className="font-bold mt-2">
                      {selectedPlan.price === 0 
                        ? "Grátis" 
                        : `UU$${(selectedPlan.price / 100).toFixed(2)}/mês`}
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-sweet"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Continuar'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Button 
                  variant="link" 
                  onClick={() => navigate('/login')}
                  className="p-0"
                >
                  Entrar
                </Button>
              </p>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Escolha Seu Parceiro Virtual</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePersonalizeSubmit} className="space-y-6">
                {loadingAgents ? (
                  <div className="text-center py-12">Carregando opções de parceiros...</div>
                ) : (
                  <Carousel className="w-full max-w-3xl mx-auto">
                    <CarouselContent>
                      {agents.map((agent) => (
                        <CarouselItem key={agent.id} className="md:basis-1/2 lg:basis-1/3">
                          <div 
                            className={`h-full p-1 cursor-pointer`}
                            onClick={() => setSelectedAgentId(agent.id)}
                          >
                            <div 
                              className={`h-full rounded-xl overflow-hidden border-2 p-4 flex flex-col ${
                                selectedAgentId === agent.id 
                                  ? 'border-pink-500 bg-pink-50' 
                                  : 'border-gray-200 hover:border-pink-300'
                              }`}
                            >
                              <div className="w-full aspect-square mb-4 overflow-hidden rounded-lg">
                                <img 
                                  src={agent.avatar_url || "https://i.imgur.com/nV9pbvg.jpg"} 
                                  alt={agent.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <h3 className="font-semibold text-lg">{agent.name}</h3>
                              <p className="text-sm text-gray-600 flex-1">{agent.description}</p>
                              {selectedAgentId === agent.id && (
                                <div className="mt-2">
                                  <svg className="w-6 h-6 text-pink-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="flex justify-center mt-4 space-x-4">
                      <CarouselPrevious />
                      <CarouselNext />
                    </div>
                  </Carousel>
                )}
                
                <div className="space-y-2 max-w-md mx-auto">
                  <Label htmlFor="nickname">Dê um apelido carinhoso ao seu parceiro</Label>
                  <Input
                    id="nickname"
                    placeholder="Ex: Meu amor, Querido, etc."
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    type="submit" 
                    className="px-8 py-2 bg-gradient-sweet"
                    disabled={loading || !selectedAgentId}
                  >
                    {loading ? 'Salvando...' : selectedPlanId ? 'Continuar para o Checkout' : 'Continuar para Escolher Plano'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
