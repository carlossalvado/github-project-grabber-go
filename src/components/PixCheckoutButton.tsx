import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import BuyerInfoForm from './BuyerInfoForm';
import PixModal from './PixModal';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PixCheckoutButtonProps {
  purchaseType: 'credit';
  itemId: string;
  displayText: string;
  onPurchaseSuccess: () => void;
  onPixModalOpen?: () => void; // A PROPRIEDADE FOI ADICIONADA AQUI
  disabled?: boolean;
}

const PixCheckoutButton: React.FC<PixCheckoutButtonProps> = ({ purchaseType, itemId, displayText, onPurchaseSuccess, onPixModalOpen, disabled }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showBuyerInfoForm, setShowBuyerInfoForm] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; copyPasteCode: string; paymentId: string } | null>(null);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, cpf')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw new Error("Erro ao buscar perfil do usuário.");

      if (!profile.full_name || !profile.cpf) {
        setShowBuyerInfoForm(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-asaas-pix-checkout', {
        body: { packageId: itemId },
        headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setPixData(data);
      
      // AQUI ELE CHAMA O AVISO ANTES DE ABRIR O MODAL DO PIX
      if (onPixModalOpen) {
        onPixModalOpen();
      }

      setShowPixModal(true);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        onClick={handlePurchase}
        disabled={isLoading || disabled}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {displayText}
      </Button>

      <BuyerInfoForm
        isOpen={showBuyerInfoForm}
        onClose={() => setShowBuyerInfoForm(false)}
        onSaveSuccess={handlePurchase}
      />
      
      {pixData && (
        <PixModal
          isOpen={showPixModal}
          onClose={() => setShowPixModal(false)}
          qrCode={pixData.qrCode}
          copyPasteCode={pixData.copyPasteCode}
          paymentId={pixData.paymentId}
          onPaymentSuccess={() => {
            setShowPixModal(false);
            onPurchaseSuccess();
          }}
        />
      )}
    </>
  );
};

export default PixCheckoutButton;