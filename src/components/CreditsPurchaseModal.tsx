import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X } from 'lucide-react';
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
      <DialogContent className="bg-[#1a1d29] border-blue-800/50 text-white max-w-sm w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            Comprar Créditos
          </DialogTitle>
          <DialogDescription className="text-center text-blue-300">
            Adicione créditos ao seu saldo para continuar interagindo.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
            <div className="bg-[#2F3349] p-4 rounded-lg text-center border border-blue-800/50 mb-6">
              <p className="text-blue-300 text-sm">Seu saldo atual</p>
              <div className="flex justify-center items-center my-1">
                {creditsLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                ) : (
                  <p className="text-3xl font-bold text-orange-400">{credits}</p>
                )}
              </div>
              <p className="text-blue-300 text-sm">créditos</p>
            </div>

            <div className="flex flex-col space-y-3">
              <p className="text-center text-sm text-blue-200">Selecione um pacote para comprar:</p>
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
                    onPixModalOpen={onClose} 
                  />
                ))
              )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsPurchaseModal;