import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { UpgradeModal } from './modals/UpgradeModal'; // Importa o modal que criámos

export const UpgradeWithCreditsButton: React.FC = () => {
  // Este estado controla se o modal está visível ou não.
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      {/* Este é o botão que o seu utilizador verá na página. */}
      {/* A sua única função é mudar o estado para abrir o modal. */}
      <Button onClick={() => setIsModalOpen(true)} className="w-full">
        <Sparkles className="mr-2 h-4 w-4" />
        Fazer Upgrade com Créditos
      </Button>

      {/* O componente do modal está aqui, mas escondido. */}
      {/* Ele só aparece quando 'isModalOpen' for 'true'. */}
      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};