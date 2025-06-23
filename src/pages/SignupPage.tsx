import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Recuperar dados do plano selecionado do localStorage
    const planData = localStorage.getItem('selectedPlanData');
    if (planData) {
      try {
        const plan = JSON.parse(planData);
        setSelectedPlan(plan);
      } catch (error) {
        console.error('Erro ao recuperar dados do plano:', error);
      }
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Determinar o tipo de plano
      const isTrialPlan = selectedPlan?.name?.toLowerCase().includes('trial');
      const planType = isTrialPlan ? 'trial' : selectedPlan?.name?.toLowerCase();
      
      await signUp(email, password, fullName, planType);
      
      // Salvar dados do usuário no cache
      const userData = {
        email,
        fullName,
        selectedPlan,
        planType,
        signupCompleted: true
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      
      toast.success('Conta criada com sucesso!');
      
      // Sempre ir para personalização primeiro
      navigate('/personalize');
    } catch (error: any) {
      toast.error('Erro ao criar conta: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Tripled Background Images */}
      <div className="absolute top-20 left-10 w-18 h-18 md:w-36 md:h-36 rounded-full overflow-hidden opacity-10 animate-pulse">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-10 left-60 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-12 animate-pulse delay-500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-40 left-96 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute bottom-20 right-10 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-15 animate-pulse delay-1000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-10 right-60 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-14 animate-pulse delay-1500">
        <img 
          src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-32 right-96 w-18 h-18 md:w-36 md:h-36 rounded-full overflow-hidden opacity-9 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute top-1/3 right-20 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-10 animate-pulse delay-2000">
        <img 
          src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1/2 left-5 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-12 animate-pulse delay-2500">
        <img 
          src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-2/3 right-5 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-11 animate-pulse delay-3000">
        <img 
          src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" 
          alt="AI Avatar" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full max-w-4xl mx-auto p-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logo and Brand */}
          <div className="flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-pink-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                  <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
                </div>
                <div className="absolute -top-1 -left-1 w-10 h-10 rounded-full overflow-hidden opacity-40">
                  <img 
                    src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
                    alt="AI Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-pink-500 mb-2">
                Isa Date
              </h1>
              <p className="text-slate-300">
                Crie sua conta gratuitamente
              </p>
            </div>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Criar Conta</CardTitle>
                <CardDescription className="text-slate-400">
                  Junte-se a milhares de pessoas que já encontraram sua conexão especial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-500" />
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500"
                    />
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-pink-500" />
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                        Criando conta...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Criar Conta
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-400">
                    Já tem uma conta?{' '}
                    <Link 
                      to="/login" 
                      className="text-pink-500 hover:text-pink-400 font-medium transition-colors"
                    >
                      Fazer login
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Preview */}
          {selectedPlan && (
            <div className="flex flex-col justify-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Plano Selecionado</h2>
                <p className="text-slate-300">Veja o que você terá acesso</p>
              </div>

              <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 border-2 border-pink-500/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-white">{selectedPlan.name}</CardTitle>
                  <CardDescription className="text-slate-300">{selectedPlan.description}</CardDescription>
                  <div className="text-3xl font-bold text-pink-500 mt-4">
                    {selectedPlan.price === 0 
                      ? "Grátis" 
                      : `US$${(selectedPlan.price / 100).toFixed(2)}`}
                    {selectedPlan.price > 0 && <span className="text-sm font-normal text-white">/mês</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedPlan.features.text && (
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-white">Mensagens de Texto</span>
                      </li>
                    )}
                    {selectedPlan.features.audio && (
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-white">Mensagens de Áudio</span>
                      </li>
                    )}
                    {selectedPlan.features.premium && (
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-white">Recursos Premium</span>
                      </li>
                    )}
                    {selectedPlan.trial_days > 0 && (
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-white">{selectedPlan.trial_days} dias grátis</span>
                      </li>
                    )}
                  </ul>

                  <div className="mt-6 p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
                    <p className="text-pink-300 text-sm text-center">
                      ✨ {selectedPlan.name?.toLowerCase().includes('trial') 
                        ? 'Após criar sua conta, você será direcionado para personalizar sua experiência e depois para o profile!'
                        : 'Após criar sua conta, você será direcionado para personalizar sua experiência e depois finalizar a compra!'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
