
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AudioCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
}

const AudioCreditsModal: React.FC<AudioCreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits
}) => {
  const handlePurchase = async () => {
    try {
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
              Você tem <span className="font-bold text-purple-600">{currentCredits} créditos</span> restantes
            </p>
            <p className="text-xs text-gray-500">
              Cada mensagem de áudio consome 1 crédito
            </p>
          </div>

          <Card className="border-purple-200">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg">100 Créditos de Áudio</CardTitle>
              <CardDescription>
                Envie até 100 mensagens de áudio
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-4">
                $9.99
              </div>
              <Button 
                onClick={handlePurchase}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Comprar Agora
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

export default AudioCreditsModal;
