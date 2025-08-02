import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64: string;
  copyPasteCode: string;
}

const PixModal: React.FC<PixModalProps> = ({ isOpen, onClose, qrCodeBase64, copyPasteCode }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(copyPasteCode);
    toast.success("Código PIX copiado!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#1a1d29] border-blue-800/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Pague com PIX</DialogTitle>
          <DialogDescription className="text-center text-blue-300">
            Escaneie o QR Code com o app do seu banco.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-2 bg-white rounded-lg">
            {qrCodeBase64 && <img src={qrCodeBase64} alt="PIX QR Code" className="w-48 h-48" />}
          </div>
          <div className="w-full p-3 bg-[#2F3349] rounded-lg">
            <p className="text-center font-mono text-xs break-all">{copyPasteCode}</p>
          </div>
          <Button onClick={handleCopy} className="w-full bg-blue-600 hover:bg-blue-700">
            <Copy className="mr-2 h-4 w-4" />
            Copiar Código
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default PixModal;