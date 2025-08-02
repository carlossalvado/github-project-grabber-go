import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BuyerInfoForm from './BuyerInfoForm';
import PixModal from './PixModal';

interface PicPayCheckoutButtonProps {
  checkoutType: 'gift'; // Simplificado para o seu caso de uso
  giftId?: string | null;
  recipientId?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const PicPayCheckoutButton: React.FC<PicPayCheckoutButtonProps> = ({ checkoutType, giftId, recipientId, children, className, disabled }) => {
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
      const body = { giftId, recipientId };
      const { data, error } = await supabase.functions.invoke('create-picpay-gift-checkout', { body });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.qrCode && data.paymentUrl) {
        setQrCode(data.qrCode);
        setPixUrl(data.paymentUrl);
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

      if (!data?.full_name?.trim() || !data?.cpf?.trim() || !data?.phone?.trim()) {
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

export default PicPayCheckoutButton;