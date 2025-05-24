
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

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
      await signUp(email, password, fullName);
      toast.success('Conta criada com sucesso! Verifique seu email.');
      navigate('/home');
    } catch (error: any) {
      toast.error('Erro ao criar conta: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-isa-dark flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-4">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-isa rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-8 h-8 text-isa-white" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-isa mb-2">
            Isa Date
          </h1>
          <p className="text-isa-light">
            Crie sua conta gratuitamente
          </p>
        </div>

        <Card className="bg-isa-card border-isa-purple">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-isa-white">Criar Conta</CardTitle>
            <CardDescription className="text-isa-muted">
              Junte-se a milhares de pessoas que já encontraram sua conexão especial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-isa-white flex items-center gap-2">
                  <User className="w-4 h-4 text-isa-purple" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="input-isa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-isa-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-isa-purple" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-isa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-isa-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-isa-purple" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-isa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-isa-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-isa-purple" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-isa"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-isa-primary py-3"
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
              <p className="text-isa-muted">
                Já tem uma conta?{' '}
                <Link 
                  to="/login" 
                  className="text-isa-purple hover:text-isa-pink font-medium transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
