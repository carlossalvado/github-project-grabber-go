
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stripe_price_id: string | null;
}

interface GiftSelectionProps {
  onClose: () => void;
  onSelectGift: (giftId: string, giftName: string, giftPrice: number) => void;
}

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose, onSelectGift }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const { data, error } = await supabase
          .from('gifts')
          .select('*')
          .order('price', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setGifts(data as Gift[]);
        }
        
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
    if (!selectedGift || !user) {
      toast.error('Você precisa estar logado para comprar presentes');
      return;
    }
    
    const gift = gifts.find(g => g.id === selectedGift);
    if (!gift) {
      toast.error('Presente não encontrado');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Iniciando compra de presente:", gift.name);
      
      const { data, error } = await supabase.functions.invoke('create-gift-checkout', {
        body: {
          giftId: gift.id
        }
      });

      if (error) {
        console.error("Erro na function invoke:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      console.log("Checkout session criada:", data);

      if (data?.url) {
        console.log("Redirecionando para:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
      
    } catch (error: any) {
      console.error('Erro ao processar compra:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <span className="text-2xl">🎁</span>
            Enviar um Presente
          </DialogTitle>
        </DialogHeader>
        
        {loadingGifts ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Carregando presentes disponíveis...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-4 max-h-96 overflow-y-auto">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 ${
                  selectedGift === gift.id 
                    ? 'border-purple-500 bg-gray-700 shadow-lg scale-105' 
                    : 'border-gray-600 hover:border-purple-400 hover:bg-gray-700 hover:shadow-md'
                }`}
                onClick={() => setSelectedGift(gift.id)}
              >
                <div className="aspect-square mb-3 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-4xl animate-pulse">{gift.image_url}</span>
                </div>
                <h3 className="font-semibold text-sm text-white mb-1">{gift.name}</h3>
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{gift.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-purple-400">
                    US$ {(gift.price / 100).toFixed(2)}
                  </div>
                  {selectedGift === gift.id && (
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button
            onClick={handleGiftPurchase}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 rounded-lg transition-all duration-200"
            disabled={!selectedGift || loading || loadingGifts}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>💳</span>
                Comprar e Enviar Presente
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiftSelection;
