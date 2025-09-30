
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
}

interface VoiceCreditProduct {
  id: string;
  name: string;
  credits: number;
  price: number;
}

const VoiceCreditsModal: React.FC<VoiceCreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits
}) => {
  const [product, setProduct] = useState<VoiceCreditProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProduct();
    }
  }, [isOpen]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voice_credit_products')
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao buscar produto de créditos de voz:', error);
        toast.error('Erro ao carregar dados do produto');
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast.error('Erro ao carregar dados do produto');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;

    try {
      setPurchasing(true);
      
      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('create-paypal-voice-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

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
      console.error('Erro ao processar compra de créditos de voz:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="animate-spin mr-2" />
            <span>Carregando...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!product) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Erro ao Carregar Produto
            </DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p>Não foi possível carregar os dados do produto.</p>
            <Button onClick={onClose} className="mt-4">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Comprar Créditos de Chamada de Voz
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Você tem <span className="font-bold text-purple-600">{currentCredits} créditos</span> restantes
            </p>
            <p className="text-xs text-gray-500">
              Cada chamada de voz consome 20 créditos
            </p>
          </div>

          <Card className="border-purple-200">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>
                Faça até {product.credits} chamadas de voz
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-4">
                ${(product.price / 100).toFixed(2)}
              </div>
              <Button 
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-purple-600 hover:bg-purple-700"
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
            Pagamento seguro processado pelo PayPal
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCreditsModal;
