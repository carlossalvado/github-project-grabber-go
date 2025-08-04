import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import PixCheckoutButton from '@/components/PixCheckoutButton';
import { Database } from '@/integrations/supabase/types'; // Importa os tipos atualizados

// Usa o tipo gerado pelo Supabase para garantir consistência
type CreditPackage = Database['public']['Tables']['credit_packages']['Row'];

interface CreditsSelectionProps {
  onClose: () => void;
}

const CreditsSelection: React.FC<CreditsSelectionProps> = ({ onClose }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      // O 'from' agora entende 'credit_packages' por causa dos tipos atualizados
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('price_in_cents', { ascending: true });

      if (error) {
        console.error("Erro ao buscar pacotes de crédito:", error);
      } else {
        // O 'data' agora corresponde ao tipo CreditPackage[]
        setPackages(data || []);
      }
      setLoading(false);
    };
    fetchPackages();
  }, []);

  return (
    <div className="absolute bottom-20 right-4 bg-[#2F3349] p-4 rounded-lg shadow-lg z-30 w-64 border border-blue-800/50">
      <h3 className="text-white font-bold mb-4 text-center">Comprar Créditos</h3>
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="animate-spin text-white" />
        </div>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg) => (
            <PixCheckoutButton
              key={pkg.id}
              purchaseType="credit"
              itemId={pkg.id}
              displayText={`${pkg.credits_amount} Créditos - R$ ${(pkg.price_in_cents / 100).toFixed(2)}`}
              onPurchaseSuccess={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CreditsSelection;