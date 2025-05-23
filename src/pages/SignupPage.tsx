
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const SignupPage = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const { signUp } = useAuth();
  
  useEffect(() => {
    // Recuperar o plano selecionado do localStorage para exibir
    const planId = localStorage.getItem('selectedPlanId');
    const planDetails = localStorage.getItem('sweet-ai-selected-plan-details');
    
    if (planDetails) {
      try {
        const plan = JSON.parse(planDetails);
        setSelectedPlan(plan);
      } catch (error) {
        console.error('Erro ao carregar detalhes do plano:', error);
      }
    }
  }, []);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerms || !agreeAge) {
      toast.error('Você precisa concordar com os termos e confirmar sua idade.');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password, fullName);
      localStorage.setItem('userCountry', country);
      toast.success('Cadastro realizado com sucesso!');
      
      // Redirecionar para personalização
      navigate('/personalize');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
            Crie sua conta
          </h1>
          <p className="text-gray-600">
            Comece sua jornada de relacionamento virtual
          </p>
        </div>
        
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
                  <p className="text-gray-600 text-sm">Você será direcionado para finalizar sua assinatura após o cadastro</p>
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
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Entrar
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
