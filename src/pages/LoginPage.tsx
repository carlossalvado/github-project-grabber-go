
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { plans } = useSubscription();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success('Login realizado com sucesso!');
      // Redirecionar diretamente para o perfil
      navigate('/profile', { replace: true });
    } catch (error: any) {
      toast.error('Erro ao fazer login: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrialSignup = () => {
    // Salvar o plano Trial selecionado no localStorage antes de ir para o cadastro
    const trialPlan = plans.find(p => p.trial_days > 0);
    if (trialPlan) {
      localStorage.setItem('selectedPlanId', trialPlan.id.toString());
      localStorage.setItem('selectedPlanData', JSON.stringify(trialPlan));
    }
    // Redirecionar para a página de cadastro
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Tripled Background Images */}
      <div className="absolute top-10 right-20 w-40 h-40 rounded-full overflow-hidden opacity-10 animate-pulse">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-20 right-60 w-32 h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-500">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-40 right-96 w-24 h-24 rounded-full overflow-hidden opacity-12 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute bottom-10 left-20 w-32 h-32 rounded-full overflow-hidden opacity-15 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-32 left-60 w-28 h-28 rounded-full overflow-hidden opacity-12 animate-pulse delay-1500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-20 left-96 w-36 h-36 rounded-full overflow-hidden opacity-10 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute top-1/2 left-10 w-20 h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/3 right-10 w-24 h-24 rounded-full overflow-hidden opacity-14 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-2/3 right-32 w-28 h-28 rounded-full overflow-hidden opacity-9 animate-pulse delay-3500">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full max-w-md mx-auto p-4 relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-pink-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full overflow-hidden opacity-30">
              <img 
                src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
                alt="AI Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-pink-500 mb-2">
            Isa Date
          </h1>
          <p className="text-slate-300">
            Entre na sua conta
          </p>
        </div>

        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Fazer Login</CardTitle>
            <CardDescription className="text-slate-400">
              Acesse sua conta para continuar suas conversas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-pink-500" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Entrar
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Ainda não tem uma conta?{' '}
                <button 
                  onClick={handleTrialSignup}
                  className="text-pink-500 hover:text-pink-400 font-medium transition-colors underline bg-transparent border-none cursor-pointer"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
