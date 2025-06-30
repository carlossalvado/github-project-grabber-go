
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AudioCreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AudioCreditsPurchaseModal: React.FC<AudioCreditsPurchaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      const { data, error } = await supabase.functions.invoke('create-audio-credits-checkout');

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
        onClose();
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error: any) {
      console.error('Erro ao processar compra:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Comprar Créditos de Áudio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Você não tem créditos suficientes
            </p>
            <p className="text-xs text-gray-500">
              Cada mensagem de áudio consome 1 crédito
            </p>
          </div>

          <Card className="border-orange-200">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg">20 Créditos de Áudio</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-4">
                $4.99
              </div>
              <Button 
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Comprar Agora
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 text-center">
            Pagamento seguro processado pelo Stripe
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudioCreditsPurchaseModal;
