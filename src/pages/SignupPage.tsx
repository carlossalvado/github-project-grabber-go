import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Mail, Lock, User, ArrowRight, Check, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
// MODIFICAÇÃO: Importa o componente de modal que você já tem.
import TermsOfUseModal from '@/components/TermsOfUseModal';
import { Loader2 } from 'lucide-react'; // Adicionado para consistência, caso não estivesse importado

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  // MODIFICAÇÃO: Adiciona o estado para controlar a visibilidade do modal.
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Estados para verificação de email
  const [showEmailVerification, setShowEmailVerification] = useState(true);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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

  // Timer para código de confirmação
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Função para enviar código de confirmação
  const sendConfirmationCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    setIsSendingCode(true);
    try {
      // Chamar função Supabase para enviar código
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setTimeLeft(10 * 60); // 10 minutos em segundos
        toast.success('Código de confirmação enviado para seu email!');
      } else {
        throw new Error(data.error || 'Erro ao enviar código');
      }
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      toast.error('Erro ao enviar código de confirmação. Tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Função para verificar código
  const verifyConfirmationCode = async () => {
    if (!confirmationCode) {
      toast.error('Por favor, insira o código de confirmação');
      return;
    }

    setIsVerifyingCode(true);
    try {
      // Verificar código na tabela email_verifications
      const { data, error } = await (supabase as any)
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('verification_code', confirmationCode.toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error('Código inválido ou expirado. Verifique e tente novamente.');
        return;
      }

      // Marcar código como usado
      const { error: updateError } = await (supabase as any)
        .from('email_verifications')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id);

      if (updateError) {
        console.error('Erro ao marcar código como usado:', updateError);
        // Não falha a verificação por isso
      }

      toast.success('Email confirmado com sucesso!');
      setShowEmailVerification(false); // Esconde verificação e mostra formulário
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Função para reenviar código
  const resendConfirmationCode = async () => {
    if (timeLeft > 0) {
      toast.error(`Aguarde ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} para reenviar`);
      return;
    }
    await sendConfirmationCode();
  };


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

    if (!ageConfirmed) {
      toast.error('Você precisa confirmar que é maior de 18 anos.');
      return;
    }
    if (!termsAccepted) {
      toast.error('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }
    if (!emailConsent) {
      toast.error('Você precisa autorizar o recebimento de emails promocionais.');
      return;
    }

    setIsLoading(true);

    try {
      // Email já foi verificado via Resend, agora criar conta no Supabase Auth normalmente
      const isTrialPlan = selectedPlan?.name?.toLowerCase().includes('trial');
      const planType = isTrialPlan ? 'trial' : selectedPlan?.name?.toLowerCase();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Aguardar um pouco para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não foi criado');

      // Para usuários trial, iniciar trial e agendar emails imediatamente
      if (isTrialPlan) {
        try {
          console.log('🚀 Iniciando trial para usuário...');

          // Iniciar trial usando a função RPC
          const { data: trialData, error: trialError } = await supabase.rpc('start_trial', {
            user_uuid: user.id
          });

          if (trialError) {
            console.error('Erro ao iniciar trial:', trialError);
            // Não falhar o cadastro por causa do trial
          } else {
            console.log('✅ Trial iniciado com sucesso - 72 horas');

            // Agendar emails de boas-vindas
            const currentTime = new Date();

            // Email inicial: 2 minutos após cadastro
            await (supabase as any).from('welcome_email_schedule').insert({
              user_id: user.id,
              email: email,
              user_name: fullName,
              trial_day: 1,
              scheduled_at: new Date(currentTime.getTime() + 2 * 60 * 1000).toISOString()
            });

            // Email dia 2: às 22h do próximo dia (horário de Brasília)
            const tomorrow = new Date(currentTime);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(22, 0, 0, 0);

            await (supabase as any).from('welcome_email_schedule').insert({
              user_id: user.id,
              email: email,
              user_name: fullName,
              trial_day: 2,
              scheduled_at: tomorrow.toISOString()
            });

            // Email dia 3: às 22h do dia seguinte
            const dayAfterTomorrow = new Date(currentTime);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            dayAfterTomorrow.setHours(22, 0, 0, 0);

            await (supabase as any).from('welcome_email_schedule').insert({
              user_id: user.id,
              email: email,
              user_name: fullName,
              trial_day: 3,
              scheduled_at: dayAfterTomorrow.toISOString()
            });

            console.log('📧 Emails de boas-vindas agendados');
          }
        } catch (error) {
          console.error('Erro no processamento do trial:', error);
          // Não falhar o cadastro
        }
      }

      // Salvar perfil no Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          credits: 30,
          plan_name: planType || null,
          plan_active: planType ? true : false,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Erro ao salvar perfil:', profileError);
      }

      // Preparar dados para o próximo passo
      const userData = {
        email,
        fullName,
        selectedPlan,
        planType,
        signupCompleted: true
      };
      localStorage.setItem('userData', JSON.stringify(userData));

      toast.success('Conta criada com sucesso! Bem-vindo ao Isa Date!');
      navigate('/personalize');

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao criar conta: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !ageConfirmed || !termsAccepted || !emailConsent;

  return (
    <>
      <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden p-4">
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
                  {/* Verificação de Email */}
                  {showEmailVerification && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Verificação de Email</h3>
                        <p className="text-slate-300">Primeiro, vamos confirmar seu endereço de email</p>
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

                      <Button
                        onClick={sendConfirmationCode}
                        disabled={isSendingCode || !email}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                        {isSendingCode ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Enviando código...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Send className="w-5 h-5" />
                            Enviar Código de Confirmação
                          </div>
                        )}
                      </Button>

                      {/* Formulário de verificação de código */}
                      {timeLeft > 0 && (
                        <div className="space-y-4 border-t border-slate-600 pt-6">
                          <div className="text-center">
                            <h4 className="text-white font-semibold mb-2">Digite o código enviado</h4>
                            <p className="text-slate-300 text-sm">Enviamos um código para <strong>{email}</strong></p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmationCode" className="text-white flex items-center gap-2">
                              <Mail className="w-4 h-4 text-pink-500" />
                              Código de Confirmação
                            </Label>
                            <Input
                              id="confirmationCode"
                              type="text"
                              value={confirmationCode}
                              onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                              placeholder="Digite o código de 6 dígitos"
                              maxLength={6}
                              className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500 text-center text-2xl tracking-widest"
                            />
                          </div>

                          <div className="flex items-center justify-center gap-2 text-slate-300">
                            <Clock className="w-4 h-4" />
                            <span>Código expira em {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => {
                                setConfirmationCode('');
                                setTimeLeft(0);
                              }}
                              variant="outline"
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              Voltar
                            </Button>
                            <Button
                              onClick={verifyConfirmationCode}
                              disabled={isVerifyingCode || confirmationCode.length !== 6}
                              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                              {isVerifyingCode ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  Verificando...
                                </div>
                              ) : (
                                'Confirmar Código'
                              )}
                            </Button>
                          </div>

                          <Button
                            onClick={resendConfirmationCode}
                            variant="ghost"
                            disabled={timeLeft > 0}
                            className="w-full text-pink-400 hover:text-pink-300 disabled:text-slate-500"
                          >
                            Reenviar código {timeLeft > 0 && `(${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulário de Cadastro (aparece após verificação) */}
                  {!showEmailVerification && (
                    <form onSubmit={handleSignup} className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Complete seu Cadastro</h3>
                        <p className="text-slate-300">Email confirmado! Agora preencha os dados restantes</p>
                      </div>

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
                          disabled
                          className="bg-slate-700/80 border-slate-600 text-white opacity-50 cursor-not-allowed"
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

                      <div className="space-y-4 pt-2">
                        <div className="flex items-center space-x-3">
                          <Checkbox id="age" checked={ageConfirmed} onCheckedChange={(checked) => setAgeConfirmed(Boolean(checked))} className="border-slate-600" />
                          <Label htmlFor="age" className="text-sm font-medium leading-none text-white cursor-pointer">
                            Declaro ser maior de 18 anos.
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))} className="border-slate-600" />
                          <Label htmlFor="terms" className="text-sm font-medium leading-none text-white cursor-pointer">
                            Eu li e aceito os{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsTermsModalOpen(true);
                              }}
                              className="underline text-pink-400 hover:text-pink-300 ml-1"
                            >
                              Termos de Uso e a Política de Privacidade
                            </button>
                            .
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox id="emailConsent" checked={emailConsent} onCheckedChange={(checked) => setEmailConsent(Boolean(checked))} className="border-slate-600" />
                          <Label htmlFor="emailConsent" className="text-sm font-medium leading-none text-white cursor-pointer">
                            Autorizo o recebimento de emails promocionais e de marketing.
                          </Label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Criando conta...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <User className="w-5 h-5" />
                            Criar Conta
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        )}
                      </Button>
                    </form>
                  )}

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

      <TermsOfUseModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
    </>
  );
};

export default SignupPage;
