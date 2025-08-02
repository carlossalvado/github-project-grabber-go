import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BuyerInfoForm from './BuyerInfoForm';
import PixModal from './PixModal';

interface PixCheckoutButtonProps {
  checkoutType: 'gift' | 'audio' | 'voice' | 'plan';
  giftId?: string | null;
  recipientId?: string;
  amount?: number | null;
  planId?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

// O nome do componente agora é PixCheckoutButton, alinhado com o nome do arquivo.
const PixCheckoutButton: React.FC<PixCheckoutButtonProps> = ({
  checkoutType,
  giftId,
  recipientId,
  amount,
  planId,
  children,
  className,
  disabled,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [pixUrl, setPixUrl] = useState('');

  const proceedToCheckout = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let functionName = '';
      let body: any = {};

      // Lógica para definir qual função do Supabase chamar
      switch (checkoutType) {
        case 'gift':
          // AQUI ESTÁ A CHAMADA CORRETA PARA A FUNÇÃO DO ASAAS
          functionName = 'create-asaas-pix-checkout';
          body = { giftId };
          break;
        // Adicione aqui a lógica para outros tipos de checkout (áudio, voz, etc.) se necessário
        // Exemplo:
        // case 'audio':
        //   functionName = 'create-asaas-audio-checkout';
        //   body = { amount };
        //   break;
        default:
          throw new Error("Tipo de checkout não implementado.");
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.qrCode && data.copyPasteCode) {
        setQrCode(data.qrCode);
        setPixUrl(data.copyPasteCode);
        setShowPixModal(true);
      } else {
        throw new Error('Dados do PIX não foram recebidos do servidor.');
      }
    } catch (error: any) {
      toast.error(`Erro no checkout: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInitialClick = async () => {
    if (disabled || isLoading) return;
    if (!user) {
      toast.error('Você precisa estar logado.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('full_name, cpf, phone').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;

      // Asaas PIX só precisa de nome e CPF
      if (!data?.full_name?.trim() || !data?.cpf?.trim()) {
        setShowBuyerForm(true);
      } else {
        await proceedToCheckout();
      }
    } catch (error: any) {
      toast.error("Erro ao verificar suas informações: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BuyerInfoForm 
        isOpen={showBuyerForm}
        onClose={() => setShowBuyerForm(false)}
        onSuccess={() => {
          setShowBuyerForm(false);
          proceedToCheckout();
        }}
      />
      <PixModal 
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        qrCodeBase64={qrCode}
        copyPasteCode={pixUrl}
      />
      <Button onClick={handleInitialClick} className={className} disabled={disabled || isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
      </Button>
    </>
  );
};

export default PixCheckoutButton;