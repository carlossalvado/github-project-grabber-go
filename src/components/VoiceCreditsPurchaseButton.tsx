
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceCreditsPurchaseButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

const VoiceCreditsPurchaseButton: React.FC<VoiceCreditsPurchaseButtonProps> = ({ onClick, disabled }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-voice-credits-checkout');

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
      console.error('Erro ao processar compra de créditos de voz:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
    </Button>
  );
};

export default VoiceCreditsPurchaseButton;
