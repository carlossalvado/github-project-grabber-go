
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
      // Login attempt
      await signIn(email, password);
      
      // After successful login, check user profile
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (userData && userData.user) {
        // Query user profile to check plan
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', userData.user.id)
          .single();
        
        if (profileError) {
          console.error("Error querying profile:", profileError);
        }
        
        // Also check if there's an active subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('plan_name, status')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subscriptionError) {
          console.error("Error querying subscription:", subscriptionError);
        }

        // Use subscription data if available, otherwise use profile
        const hasActivePlan = 
          (subscriptionData && subscriptionData.status === 'active') || 
          (profileData && profileData.plan_active === true);
          
        const planName = 
          (subscriptionData && subscriptionData.plan_name) || 
          (profileData && profileData.plan_name);
        
        // If there's a discrepancy between profile and subscription, update profile
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
            console.error("Error updating profile with subscription data:", updateError);
          } else {
            console.log("Profile updated with subscription data");
          }
        }
        
        // Simple login success toast without redirects
        toast.success(hasActivePlan ? 
          `Welcome! ${planName} plan active.` : 
          "Login successful! Choose a plan to continue.");
          
        // Direct to chat if plan is active, otherwise to home
        navigate(hasActivePlan ? '/chat' : '/home');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sweetheart-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-gray-600">Sign in to continue your journey</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-right">
                  <Button variant="link" className="p-0 text-sm">
                    Forgot password?
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-sweet flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Processing...' : (
                  <>
                    <LogIn size={16} /> Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Button 
                variant="link" 
                onClick={() => navigate('/home')}  // Redirects to home
                className="p-0"
              >
                Sign Up
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
