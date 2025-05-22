
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
}

// Default gifts with emojis instead of image URLs
const defaultGifts: Gift[] = [
  {
    id: "1",
    name: "Rosa Vermelha",
    description: "Uma bela rosa vermelha para expressar seu amor",
    price: 500, // em centavos
    image_url: "❤️"
  },
  {
    id: "2",
    name: "Caixa de Chocolates",
    description: "Deliciosos chocolates para adoçar o momento",
    price: 1500, // em centavos
    image_url: "🍫"
  },
  {
    id: "3",
    name: "Ursinho de Pelúcia",
    description: "Um fofo ursinho para demonstrar seu carinho",
    price: 2500, // em centavos
    image_url: "🧸"
  },
  {
    id: "4",
    name: "Buquê de Flores",
    description: "Um lindo buquê de flores variadas",
    price: 3500, // em centavos
    image_url: "💐"
  }
];

interface GiftSelectionProps {
  onClose: () => void;
  onSelectGift: (giftId: string, giftName: string, giftPrice: number) => void;
}

const GiftSelection: React.FC<GiftSelectionProps> = ({ onClose, onSelectGift }) => {
  const [gifts, setGifts] = useState<Gift[]>(defaultGifts);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const { data, error } = await supabase
          .from('gifts')
          .select('*');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setGifts(data as Gift[]);
        }
        
      } catch (error) {
        console.error('Erro ao carregar os presentes:', error);
        // Manteremos os presentes padrão em caso de erro
      } finally {
        setLoadingGifts(false);
      }
    };

    fetchGifts();
  }, []);

  const handleGiftPurchase = async () => {
    if (!selectedGift || !user) return;
    
    const gift = gifts.find(g => g.id === selectedGift);
    if (!gift) return;
    
    setLoading(true);
    
    try {
      // Aqui seria o lugar para adicionar integração com o Stripe para pagamento único
      // Vamos simular um sucesso após um breve atraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Registrar o presente na base de dados
      const { error } = await supabase
        .from('user_purchased_gifts')
        .insert({
          user_id: user.id,
          gift_id: gift.id,
          purchase_date: new Date().toISOString(),
          price: gift.price
        });
        
      if (error) throw error;
      
      toast.success(`Presente ${gift.name} enviado com sucesso!`);
      onSelectGift(gift.id, gift.name, gift.price);
      
    } catch (error: any) {
      console.error('Erro ao processar compra:', error);
      toast.error(error.message || 'Não foi possível processar sua compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar um Presente</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        {loadingGifts ? (
          <div className="py-6 text-center">Carregando presentes disponíveis...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className={`cursor-pointer border rounded-lg p-3 transition-all ${
                  selectedGift === gift.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
                }`}
                onClick={() => setSelectedGift(gift.id)}
              >
                <div className="aspect-square mb-2 bg-white rounded flex items-center justify-center">
                  <span className="text-4xl">{gift.image_url}</span>
                </div>
                <h3 className="font-medium text-sm">{gift.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{gift.description}</p>
                <div className="text-sm font-bold text-pink-600">
                  US$${(gift.price / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button
            onClick={handleGiftPurchase}
            className="w-full bg-gradient-sweet"
            disabled={!selectedGift || loading}
          >
            {loading ? 'Processando...' : 'Enviar Presente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiftSelection;
