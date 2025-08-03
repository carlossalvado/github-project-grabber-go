import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64: string;
  copyPasteCode: string;
  paymentId?: string;
  onTimeout?: () => void;
}

const PixModal: React.FC<PixModalProps> = ({ isOpen, onClose, qrCodeBase64, copyPasteCode, paymentId, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300); // Reset quando modal abre
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Tempo esgotado
          clearInterval(timer);
          toast.error("Tempo para pagamento esgotado");
          onTimeout?.();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose, onTimeout]);

  const handleCopy = () => {
    if (copyPasteCode) {
      navigator.clipboard.writeText(copyPasteCode);
      toast.success("Código PIX copiado!");
    }
  };

  // Formata o tempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Constrói a Data URL completa para a imagem do QR Code
  const qrCodeSrc = qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#1a1d29] border-blue-800/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Pague com PIX</DialogTitle>
          <DialogDescription className="text-center text-blue-300">
            Escaneie o QR Code com o app do seu banco.
          </DialogDescription>
          <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-orange-900/20 rounded-lg border border-orange-500/20">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-orange-300 font-mono text-sm">
              Tempo restante: {formatTime(timeLeft)}
            </span>
          </div>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-2 bg-white rounded-lg">
            {/* CORREÇÃO: Utiliza a variável qrCodeSrc que contém o prefixo correto */}
            {qrCodeSrc && <img src={qrCodeSrc} alt="PIX QR Code" className="w-48 h-48" />}
          </div>
          <div className="w-full p-3 bg-[#2F3349] rounded-lg">
            <p className="text-center font-mono text-xs break-all">
              {copyPasteCode || 'Carregando código...'}
            </p>
          </div>
          <Button onClick={handleCopy} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!copyPasteCode}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Código
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixModal;