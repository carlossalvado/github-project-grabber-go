
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PayPalCheckoutButtonProps {
  planId: number;
  disabled?: boolean;
  className?: string;
}

const PayPalCheckoutButton: React.FC<PayPalCheckoutButtonProps> = ({ 
  planId, 
  disabled, 
  className 
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayPalCheckout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-paypal-checkout', {
        body: { planId }
      });

      if (error) {
        console.error("Erro na function invoke:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error: any) {
      console.error('Erro ao processar checkout PayPal:', error);
      toast.error('Erro ao processar pagamento: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayPalCheckout}
      disabled={disabled || loading}
      className={className || "w-full"}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Confirmar e Continuar
        </>
      )}
    </Button>
  );
};

export default PayPalCheckoutButton;
