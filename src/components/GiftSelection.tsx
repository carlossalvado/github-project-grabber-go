import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Gift = Database['public']['Tables']['gifts']['Row'];

interface GiftSelectionProps {
  onClose: () => void;
  recipientId: string; // Mantido para conformidade com o código original, embora não usado na lógica de envio
}

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose, recipientId }) => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { credits, consumeCredits } = useCredits();

  useEffect(() => {
    const fetchGifts = async () => {
      setLoadingGifts(true);
      try {
        const { data, error } = await supabase
          .from('gifts')
          .select('*')
          .order('credit_cost', { ascending: true });
          
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

  const handleSendGift = async () => {
    if (!selectedGiftId || !user) {
      toast.error("Por favor, selecione um presente.");
      return;
    }

    const selectedGiftDetails = gifts.find(g => g.id === selectedGiftId);
    if (!selectedGiftDetails) {
      toast.error("Presente selecionado não é válido.");
      return;
    }

    if (credits < selectedGiftDetails.credit_cost) {
      toast.error("Créditos insuficientes para enviar este presente.");
      return;
    }

    setIsSending(true);

    const success = await consumeCredits(selectedGiftDetails.credit_cost);
    
    if (success) {
      try {
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        let chatId = chat?.id;

        if (chatError && chatError.code !== 'PGRST116') throw chatError;

        if (!chatId) {
            const { data: newChat, error: newChatError } = await supabase.from('chats').insert({ user_id: user.id, title: "Presente Recebido"}).select('id').single();
            if(newChatError || !newChat) throw new Error("Não foi possível encontrar ou criar um chat para enviar o presente.");
            chatId = newChat.id;
        }

        const giftMessage = `🎁 Presente recebido: ${selectedGiftDetails.name} ${selectedGiftDetails.image_url}`;

        const { error: messageError } = await supabase.from('chat_messages').insert({
          chat_id: chatId,
          user_id: user.id,
          message_type: 'assistant',
          text_content: giftMessage,
          status: 'completed'
        });

        if (messageError) throw messageError;

        toast.success(`Presente '${selectedGiftDetails.name}' enviado com sucesso!`);
        onClose();

      } catch (error: any) {
        toast.error(`Erro ao enviar o presente: ${error.message}`);
      }
    }
    
    setIsSending(false);
  };

  const selectedGiftDetails = gifts.find(g => g.id === selectedGiftId);

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
                className={`aspect-square p-3 md:p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-center ${
                  selectedGiftId === gift.id 
                    ? 'border-blue-500 bg-blue-900/50 shadow-lg' 
                    : 'border-blue-800/50 hover:border-blue-400 hover:bg-blue-900/30'
                }`}
                onClick={() => setSelectedGiftId(gift.id)}
              >
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
          
          <Button
            onClick={handleSendGift}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!selectedGiftId || isSending}
          >
            {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : 
              selectedGiftDetails 
              ? `Enviar por ${selectedGiftDetails.credit_cost} créditos`
              : 'Selecione um Presente'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GiftSelection;