import { useState } from 'react';
import { supabase } from '../integrations/supabase/client'; 
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PicPayCheckoutButtonProps {
  checkoutType: 'subscription' | 'audio-credits' | 'voice-credits' | 'gift';
  planId?: string;
  amount?: number;
  giftId?: string;
  recipientId?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean; 
}

const PicPayCheckoutButton = ({
  checkoutType,
  planId,
  amount,
  giftId,
  recipientId,
  className,
  children,
  disabled = false,
}: PicPayCheckoutButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
      }

      let functionName = '';
      let body: any = {};

      switch (checkoutType) {
        case 'subscription':
          functionName = 'create-picpay-checkout';
          body = { planId };
          break;
        case 'audio-credits':
          functionName = 'create-picpay-audio-checkout';
          body = { amount };
          break;
        case 'voice-credits':
          functionName = 'create-picpay-voice-checkout';
          body = { amount };
          break;
        case 'gift':
          functionName = 'create-picpay-gift-checkout';
          body = { giftId, recipientId };
          break;
        default:
          throw new Error('Tipo de checkout inválido.');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (error) {
        const errorBody = await (error as any).context.json();
        throw new Error(errorBody.error || error.message);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        if (data.error) {
            throw new Error(data.error)
        }
        throw new Error('URL de pagamento do PicPay não recebida.');
      }

    } catch (error: any) {
      console.error("Erro no checkout do PicPay:", error);
      toast({
        title: "Erro no Checkout",
        description: error.message || "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={disabled || loading} className={className}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
};

export default PicPayCheckoutButton;