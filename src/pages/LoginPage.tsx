
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tentativa de login
      await signIn(email, password);
      
      // Após login bem-sucedido, consultar o perfil do usuário para verificar o plano
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (userData && userData.user) {
        // Consultar o perfil do usuário para verificar o plano
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', userData.user.id)
          .single();
        
        if (profileError) {
          console.error("Erro ao consultar perfil:", profileError);
        }
        
        // Também verificar se há uma assinatura ativa
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('plan_name, status')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subscriptionError) {
          console.error("Erro ao consultar assinatura:", subscriptionError);
        }

        // Usar dados da assinatura se disponíveis, senão usar perfil
        const hasActivePlan = 
          (subscriptionData && subscriptionData.status === 'active') || 
          (profileData && profileData.plan_active === true);
          
        const planName = 
          (subscriptionData && subscriptionData.plan_name) || 
          (profileData && profileData.plan_name);
        
        // Se existir discrepância entre o perfil e a assinatura, atualizar o perfil
        if (subscriptionData && profileData && 
            (subscriptionData.plan_name !== profileData.plan_name || 
             profileData.plan_active !== (subscriptionData.status === 'active'))) {
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              plan_name: subscriptionData.plan_name, 
              plan_active: subscriptionData.status === 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.user.id);
            
          if (updateError) {
            console.error("Erro ao atualizar perfil com dados de assinatura:", updateError);
          } else {
            console.log("Perfil atualizado com dados de assinatura");
          }
        }
        
        // Verificar se o usuário tem um plano ativo e redirecionar para o chat
        if (hasActivePlan) {
          console.log(`Usuário tem o plano ${planName} ativo, redirecionando para o chat`);
          toast.success(`Bem-vindo! Plano ${planName} ativo.`);
          navigate('/chat');
        } else {
          // Se não tiver plano ativo, redirecionar para a home
          console.log("Usuário logado, mas sem plano ativo");
          toast.success("Login bem-sucedido! Escolha um plano para continuar.");
          navigate('/home');
        }
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error(error.message || "Falha ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-600">Entre para continuar sua jornada</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-right">
                  <Button variant="link" className="p-0 text-sm">
                    Esqueceu a senha?
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-sweet flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Processando...' : (
                  <>
                    <LogIn size={16} /> Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Button 
                variant="link" 
                onClick={() => navigate('/home')}  // Redireciona para home
                className="p-0"
              >
                Cadastre-se
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
