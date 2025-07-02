
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAudioCredits } from '@/hooks/useAudioCredits';

interface CreditsPurchaseButtonProps {
  onClick: () => void;
}

const CreditsPurchaseButton: React.FC<CreditsPurchaseButtonProps> = ({ onClick }) => {
  const { credits } = useAudioCredits();

  // Se há créditos suficientes, não mostra o componente
  if (credits >= 1) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
      onClick={onClick}
    >
      <Plus size={20} />
    </Button>
  );
};

export default CreditsPurchaseButton;
