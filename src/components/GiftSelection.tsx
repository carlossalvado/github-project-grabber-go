import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PicPayCheckoutButton from './PicPayCheckoutButton';

interface Gift {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface GiftSelectionProps {
  onClose: () => void;
  recipientId: string; 
}

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose, recipientId }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [loadingGifts, setLoadingGifts] = useState(true);

  useEffect(() => {
    const fetchGifts = async () => {
      setLoadingGifts(true);
      try {
        const { data, error } = await supabase.from('gifts').select('*').order('price', { ascending: true });
        if (error) throw error;
        setGifts(data || []);
      } catch (error) {
        toast.error('Erro ao carregar presentes.');
      } finally {
        setLoadingGifts(false);
      }
    };
    fetchGifts();
  }, []);

  const selectedGiftDetails = gifts.find(g => g.id === selectedGiftId);

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
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                className={`aspect-square p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-center ${
                  selectedGiftId === gift.id 
                    ? 'border-blue-500 bg-blue-900/50 shadow-lg' 
                    : 'border-blue-800/50 hover:border-blue-400 hover:bg-blue-900/30'
                }`}
                onClick={() => setSelectedGiftId(gift.id)}
              >
                <div className="text-4xl md:text-5xl mb-1 md:mb-2">{gift.image_url}</div>
                <div className="text-xs text-white font-medium leading-tight">
                  {gift.name}
                </div>
              </button>
            ))}
          </div>
          
          {/* ===== CORREÇÃO APLICADA AQUI ===== */}
          <PicPayCheckoutButton
            checkoutType="gift"
            giftId={selectedGiftId} // Passando como propriedade individual
            recipientId={recipientId} // Passando como propriedade individual
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!selectedGiftId}
          >
            {selectedGiftDetails 
              ? `Enviar ${selectedGiftDetails.name} (R$ ${(selectedGiftDetails.price / 100).toFixed(2)})`
              : 'Selecione um Presente'}
          </PicPayCheckoutButton>
        </div>
      )}
    </div>
  );
};

export default GiftSelection;