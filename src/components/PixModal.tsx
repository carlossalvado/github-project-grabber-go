import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, Timer, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [countdown, setCountdown] = useState(300); // 5 minutos = 300 segundos
  const paymentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(copyPasteCode)
      .then(() => toast.success("Código PIX copiado!"))
      .catch(err => toast.error("Falha ao copiar o código."));
  };

  useEffect(() => {
    // Função que limpa todos os timers
    const cleanupTimers = () => {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };

    if (isOpen) {
      // Reinicia o estado quando o modal abre
      setPaymentStatus('PENDING');
      setCountdown(300);

      // Inicia o cronômetro de 5 minutos
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            cleanupTimers();
            toast.info("Tempo esgotado. Por favor, gere um novo QR Code.");
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Inicia a verificação de pagamento
      const checkPayment = async () => {
        if (!paymentId) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          cleanupTimers();
          return;
        }

        try {
          const { data, error } = await supabase.functions.invoke('check-asaas-payment', {
            body: { paymentId },
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });

          if (error) {
            console.error("Erro ao verificar pagamento:", error);
            return;
          }

          if (data?.status === "CONFIRMED" || data?.status === "RECEIVED") {
            setPaymentStatus("CONFIRMED");
            cleanupTimers();
            setTimeout(() => {
              onPaymentSuccess(); // Chama a função para atualizar os créditos
              onClose(); // Fecha o modal
            }, 2000);
          }
        } catch (e) {
          console.error("Falha na chamada da função de verificação:", e);
          cleanupTimers();
        }
      };
      paymentCheckIntervalRef.current = setInterval(checkPayment, 5000); // Verifica a cada 5 segundos
    }

    // Função de limpeza: para todos os timers quando o componente é desmontado ou o modal é fechado
    return cleanupTimers;
  }, [isOpen, paymentId, onClose, onPaymentSuccess]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#1a1d29] border-blue-800/50 text-white max-w-sm w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            {paymentStatus === 'PENDING' ? 'Pague com PIX' : 'Pagamento Aprovado!'}
          </DialogTitle>
          <DialogDescription className="text-center text-blue-300">
            {paymentStatus === 'PENDING' 
              ? 'Abra o app do seu banco e escaneie o código abaixo.'
              : 'Seus créditos foram adicionados com sucesso!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center my-6 h-64 bg-[#2F3349] rounded-lg">
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
            <div className="flex items-center justify-center space-x-2 text-yellow-400">
              <Timer size={16} />
              <span>Expira em: {formatTime(countdown)}</span>
            </div>
            <Button
              onClick={handleCopyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full truncate"
            >
              Clique para Copiar o Código
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixModal;