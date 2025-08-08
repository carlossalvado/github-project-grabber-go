import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X, Mic, Phone } from 'lucide-react';
import PixCheckoutButton from '@/components/PixCheckoutButton';
import { useCredits } from '@/hooks/useCredits';
import { Database } from '@/integrations/supabase/types';

type CreditPackage = Database['public']['Tables']['credit_packages']['Row'];

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditsPurchaseModal: React.FC<CreditsPurchaseModalProps> = ({ isOpen, onClose }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const { credits, isLoading: creditsLoading, refreshCredits } = useCredits();

  useEffect(() => {
    if (isOpen) {
      refreshCredits();
      
      const fetchPackages = async () => {
        setLoadingPackages(true);
        const { data, error } = await supabase
          .from('credit_packages')
          .select('*')
          .order('price_in_cents', { ascending: true });

        if (error) {
          console.error("Erro ao buscar pacotes de crédito:", error);
        } else {
          setPackages(data || []);
        }
        setLoadingPackages(false);
      };
      fetchPackages();
    }
  }, [isOpen, refreshCredits]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#0f172a] via-[#101629] to-[#0c0a09] border border-blue-500/30 text-white max-w-md w-full p-0 shadow-2xl shadow-blue-500/10">
        <DialogHeader className="p-6 text-center border-b border-blue-500/20">
          <DialogTitle className="text-2xl font-bold text-white text-shadow-[0_0_12px_rgba(59,130,246,0.7)]">
            Comprar Créditos
          </DialogTitle>
          <DialogDescription className="text-center text-blue-300/80 pt-1">
            Adicione créditos ao seu saldo para continuar interagindo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
            {/* Seção de Custo dos Créditos */}
            <div className="p-4 bg-black/30 rounded-lg border border-blue-500/20 text-sm">
              <div className="space-y-3 text-blue-200/90">
                <div className="flex items-start">
                  <Mic className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Mensagem de Áudio:</span> 5 Créditos por envio.
                    <p className="text-xs text-blue-400/60">(Tempo de resposta de até 5 minutos)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Chamada de Voz:</span> 50 Créditos por chamada.
                    <p className="text-xs text-blue-400/60">(Chamada iniciada imediatamente após o uso dos créditos)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="bg-gradient-to-tr from-blue-950/50 to-transparent p-4 rounded-lg text-center border border-blue-500/20">
              <p className="text-blue-300/80 text-sm font-medium">Seu saldo atual</p>
              <div className="flex justify-center items-baseline my-1">
                {creditsLoading ? (
                  <Loader2 className="h-9 w-9 animate-spin text-orange-400" />
                ) : (
                  <p className="text-5xl font-bold text-orange-400 text-shadow-[0_0_12px_rgba(251,146,60,0.8)]">{credits}</p>
                )}
              </div>
              <p className="text-blue-300/80 text-sm -mt-1">créditos</p>
            </div>

            {/* Pacotes de Compra */}
            <div className="flex flex-col space-y-3">
              <p className="text-center text-sm text-blue-200/90 font-medium">Selecione um pacote para comprar:</p>
              {loadingPackages ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="animate-spin text-white" />
                </div>
              ) : (
                packages.map((pkg) => (
                  <PixCheckoutButton
                    key={pkg.id}
                    purchaseType="credit"
                    itemId={pkg.id}
                    displayText={`${pkg.credits_amount} Créditos - R$ ${(pkg.price_in_cents / 100).toFixed(2)}`}
                    onPurchaseSuccess={() => {
                        refreshCredits();
                        onClose();
                    }}
                  />
                ))
              )}
            </div>
        </div>
        <div className="p-4 bg-black/20 border-t border-blue-500/20 flex justify-end">
            <Button onClick={onClose} variant="ghost" className="text-blue-300 hover:bg-blue-500/10 hover:text-white">
                Fechar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsPurchaseModal;
