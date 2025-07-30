import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PicPayCheckoutButton from './PicPayCheckoutButton';

interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

interface GiftSelectionProps {
  onClose: () => void;
  recipientId: string; 
}

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose, recipientId }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [loadingGifts, setLoadingGifts] = useState(true);

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
          
          <PicPayCheckoutButton
            checkoutType="gift"
            giftId={selectedGift || undefined}
            recipientId={recipientId}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
            disabled={!selectedGift}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💝</span>
              Enviar Presente com PicPay
            </div>
          </PicPayCheckoutButton>
        </div>
      )}
    </div>
  );
};

export default GiftSelection;