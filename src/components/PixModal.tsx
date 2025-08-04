import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// A INTERFACE DE PROPRIEDADES CORRIGIDA
interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
  copyPasteCode: string;
  paymentId: string;
  onPaymentSuccess: () => void;
}

const PixModal: React.FC<PixModalProps> = ({ isOpen, onClose, qrCode, copyPasteCode, paymentId, onPaymentSuccess }) => {
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'CONFIRMED'>('PENDING');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(copyPasteCode)
      .then(() => toast.success("Código PIX copiado!"))
      .catch(err => toast.error("Falha ao copiar o código."));
  };

  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('PENDING');
    }
  }, [isOpen, paymentId]);

  useEffect(() => {
    const checkPayment = async () => {
      if (!paymentId) return;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Não foi possível verificar o pagamento: usuário não autenticado ou erro de sessão.", sessionError);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      console.log(`Verificando status do pagamento ${paymentId}...`);

      try {
        const { data, error } = await supabase.functions.invoke('check-asaas-payment', {
          body: { paymentId },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error("Erro ao invocar a função check-asaas-payment.", error);
          return; 
        }

        if (data?.status === "CONFIRMED" || data?.status === "RECEIVED") {
          console.log("✅ Pagamento confirmado pelo modal!");
          setPaymentStatus("CONFIRMED");
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          setTimeout(() => {
            onPaymentSuccess();
            onClose();
          }, 2000); 
        } else {
          console.log("...Aguardando pagamento. Status:", data?.status);
        }
      } catch (e) {
        console.error("Falha crítica na chamada da função.", e);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    if (isOpen && paymentStatus === 'PENDING') {
      intervalRef.current = setInterval(checkPayment, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, paymentId, paymentStatus, onPaymentSuccess, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2F3349] border-blue-800/50 text-white max-w-sm w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {paymentStatus === 'PENDING' ? 'Pague com PIX' : 'Pagamento Aprovado!'}
          </DialogTitle>
          <DialogDescription className="text-center text-blue-300">
            {paymentStatus === 'PENDING' 
              ? 'Abra o app do seu banco e escaneie o código abaixo.'
              : 'Seus créditos serão adicionados em breve!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center my-6 h-64 bg-[#1a1d29] rounded-lg">
          {paymentStatus === 'PENDING' ? (
            qrCode ? (
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code PIX" className="rounded-lg border-4 border-white" />
            ) : (
              <p className="text-red-400">Erro ao carregar QR Code.</p>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-green-400">
              <CheckCircle size={80} className="animate-pulse" />
            </div>
          )}
        </div>

        {paymentStatus === 'PENDING' && (
          <div className="flex flex-col space-y-4">
            <p className="text-center text-sm text-blue-300">Ou use o PIX Copia e Cola:</p>
            <Button
              onClick={handleCopyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full truncate"
            >
              {copyPasteCode ? 'Clique para Copiar o Código' : 'Código indisponível'}
            </Button>
          </div>
        )}
        
        <Button variant="ghost" onClick={onClose} className="absolute top-4 right-4 text-blue-300 hover:text-white p-2">
          <X size={20} />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PixModal;