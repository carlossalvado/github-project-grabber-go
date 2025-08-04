import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCredits } from '@/hooks/useCredits';
import { Database } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';

export type Gift = Database['public']['Tables']['gifts']['Row'];

interface GiftSelectionProps {
  onClose: () => void;
  onGiftSend: (gift: Gift) => void; // A prop para "avisar" a página de chat
}

// Função para buscar os presentes
const fetchGifts = async (): Promise<Gift[]> => {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .order('credit_cost', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose, onGiftSend }) => {
  const { credits } = useCredits();
  const [isSending, setIsSending] = useState<string | null>(null);

  const { data: gifts = [], isLoading: loadingGifts, error } = useQuery({
    queryKey: ['gifts'],
    queryFn: fetchGifts,
  });

  if (error) {
    toast.error('Não foi possível carregar os presentes.');
  }

  const handleSelectAndSendGift = (gift: Gift) => {
    if (isSending) return; // Previne múltiplos cliques enquanto um presente já está sendo enviado

    if (credits < gift.credit_cost) {
      toast.error("Créditos insuficientes para enviar este presente.");
      return;
    }
    
    setIsSending(gift.id); // Bloqueia outros botões e mostra o loader
    onGiftSend(gift); // Apenas chama a função do componente pai, passando o presente escolhido
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d29] rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col border-t border-blue-800/30">
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
          <div className="text-center text-sm text-blue-300 mb-4">Seu saldo: <span className="font-bold text-orange-400">{credits}</span> créditos</div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => handleSelectAndSendGift(gift)}
                disabled={isSending !== null || credits < gift.credit_cost}
                className="aspect-square p-3 md:p-4 rounded-lg border-2 border-blue-800/50 hover:border-blue-400 hover:bg-blue-900/30 transition-all duration-200 flex flex-col items-center justify-center text-center disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {isSending === gift.id && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"><Loader2 className="animate-spin text-white" /></div>}
                <div className="text-4xl md:text-5xl mb-1 md:mb-2">{gift.image_url}</div>
                <div className="text-xs md:text-sm text-white font-medium leading-tight mb-1">
                  {gift.name}
                </div>
                <div className="text-xs md:text-sm text-orange-400 font-bold">
                  {gift.credit_cost} créditos
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftSelection;