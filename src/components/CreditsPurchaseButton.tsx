
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreditsPurchaseButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const CreditsPurchaseButton: React.FC<CreditsPurchaseButtonProps> = ({ onClick, disabled, className }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    try {
      setLoading(true);
      
      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('create-paypal-audio-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
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
      console.error('Erro ao processar compra:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className || "w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white flex-shrink-0"}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
    </Button>
  );
};

export default CreditsPurchaseButton;
