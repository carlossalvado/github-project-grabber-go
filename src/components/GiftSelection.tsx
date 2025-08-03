import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PixModal from './PixModal';

interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

interface GiftSelectionProps {
  onClose: () => void;
}

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    copyPasteCode: string;
    paymentId: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchGifts = async () => {
      setLoadingGifts(true);
      try {
        const { data, error } = await supabase
          .from('gifts')
          .select('id, name, description, price, image_url')
          .order('price', { ascending: true });
          
        if (error) throw error;
        setGifts(data as Gift[]);
        
      } catch (error) {
        console.error('Erro ao carregar os presentes:', error);
        toast.error('Erro ao carregar presentes disponíveis');
      } finally {
        setLoadingGifts(false);
      }
    };

    fetchGifts();
  }, []);

  const handleGiftPurchase = async () => {
    if (!selectedGift) return;

    console.log("Iniciando compra de presente:", selectedGiftDetails?.name);
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await supabase.functions.invoke('create-asaas-pix-checkout', {
        body: { giftId: selectedGift },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log("Resposta da function invoke:", response);

      if (response.error) {
        console.log("Erro na function invoke:", response.error);
        throw response.error;
      }

      if (response.data?.qrCode && response.data?.copyPasteCode) {
        setPixData({
          qrCode: response.data.qrCode,
          copyPasteCode: response.data.copyPasteCode,
          paymentId: response.data.paymentId,
        });
        setIsPixModalOpen(true);
      } else {
        throw new Error("Dados de pagamento incompletos");
      }
    } catch (error) {
      console.log("Erro ao processar compra:", error);
      toast.error("Erro ao processar compra. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePixModalTimeout = async () => {
    if (pixData?.paymentId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke('cancel-asaas-payment', {
            body: { paymentId: pixData.paymentId },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        }
      } catch (error) {
        console.error("Erro ao cancelar pagamento:", error);
      }
    }
    setPixData(null);
  };

  const selectedGiftDetails = gifts.find(g => g.id === selectedGift);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d29] rounded-t-3xl shadow-2xl max-h-[60vh] flex flex-col border-t border-blue-800/30">
      <div className="flex justify-between items-center p-4 border-b border-blue-800/30 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white">Enviar Presente</h3>
        <button 
          onClick={onClose} 
          className="text-blue-200 hover:text-white transition-colors p-1 hover:bg-blue-900/50 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      
      {loadingGifts ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" />
            <p className="text-blue-200 text-sm">Carregando presentes...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                className={`aspect-square p-3 md:p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-center ${
                  selectedGift === gift.id 
                    ? 'border-blue-500 bg-blue-900/50 shadow-lg' 
                    : 'border-blue-800/50 hover:border-blue-400 hover:bg-blue-900/30'
                }`}
                onClick={() => setSelectedGift(gift.id)}
              >
                <div className="text-4xl md:text-5xl mb-1 md:mb-2">{gift.image_url}</div>
                <div className="text-xs md:text-sm text-white font-medium leading-tight mb-1">
                  {gift.name}
                </div>
                <div className="text-xs md:text-sm text-blue-400 font-bold">
                  R$ {(gift.price / 100).toFixed(2)}
                </div>
              </button>
            ))}
          </div>
          
          <Button
            onClick={handleGiftPurchase}
            disabled={!selectedGift || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : selectedGiftDetails ? (
              `Pagar com PIX (R$ ${(selectedGiftDetails.price / 100).toFixed(2)})`
            ) : (
              'Selecione um Presente'
            )}
          </Button>
        </div>
      )}

      <PixModal
        isOpen={isPixModalOpen}
        onClose={() => {
          setIsPixModalOpen(false);
          setPixData(null);
        }}
        qrCodeBase64={pixData?.qrCode || ''}
        copyPasteCode={pixData?.copyPasteCode || ''}
        paymentId={pixData?.paymentId}
        onTimeout={handlePixModalTimeout}
      />
    </div>
  );
};

export default GiftSelection;