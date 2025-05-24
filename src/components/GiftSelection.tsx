
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col border-t border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-xl font-semibold text-white">Enviar Presente</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
        >
          <X size={24} />
        </button>
      </div>
      
      {loadingGifts ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Carregando presentes...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className={`cursor-pointer border-2 rounded-2xl p-4 transition-all duration-200 ${
                  selectedGift === gift.id 
                    ? 'border-purple-500 bg-purple-900/30 shadow-lg scale-105' 
                    : 'border-gray-600 hover:border-purple-400 hover:bg-gray-800 hover:shadow-md'
                }`}
                onClick={() => setSelectedGift(gift.id)}
              >
                <div className="aspect-square mb-3 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center">
                  <span className="text-6xl animate-pulse">{gift.image_url}</span>
                </div>
                <h3 className="font-semibold text-lg text-white mb-2 text-center">{gift.name}</h3>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    US$ {(gift.price / 100).toFixed(2)}
                  </div>
                  {selectedGift === gift.id && (
                    <div className="mt-2 flex justify-center">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Send Button */}
          <Button
            onClick={handleGiftPurchase}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl transition-all duration-200 text-lg"
            disabled={!selectedGift || loading}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">💝</span>
                Enviar Presente
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GiftSelection;
