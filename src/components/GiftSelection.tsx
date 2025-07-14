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
  paypal_plan_id: string | null;
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
      
      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('create-paypal-gift-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d29] rounded-t-3xl shadow-2xl max-h-[60vh] flex flex-col border-t border-blue-800/30">
      {/* Header */}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-blue-200 text-sm">Carregando presentes...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
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
                <div className="text-4xl md:text-6xl lg:text-8xl mb-1 md:mb-2">{gift.image_url}</div>
                <div className="text-xs md:text-sm text-white font-medium leading-tight mb-1">
                  {gift.name}
                </div>
                <div className="text-xs md:text-sm text-blue-400 font-bold">
                  ${(gift.price / 100).toFixed(0)}
                </div>
              </button>
            ))}
          </div>
          
          {/* Send Button */}
          <Button
            onClick={handleGiftPurchase}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
            disabled={!selectedGift || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">💝</span>
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
