import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useCredits } from '@/hooks/useCredits'; // Importa o novo hook de créditos unificado

interface VoiceCallButtonProps {
  agentName: string;
  agentAvatar: string;
  onRequestVoiceCredits: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ agentName, agentAvatar, onRequestVoiceCredits }) => {
  const [isCalling, setIsCalling] = useState(false);
  const { credits, consumeCredits, isLoading: creditsLoading } = useCredits(); // Usa o novo hook

  const VOICE_CALL_COST = 5; // Define o custo de uma chamada de voz

  const handleCallClick = async () => {
    if (credits < VOICE_CALL_COST) {
      toast.error("Créditos insuficientes para iniciar uma chamada.");
      onRequestVoiceCredits(); // Abre o modal de compra de créditos
      return;
    }

    setIsCalling(true);
    toast.info(`Iniciando chamada com ${agentName}...`);

    const success = await consumeCredits(VOICE_CALL_COST);

    if (success) {
      // Lógica para iniciar a chamada de voz aqui
      console.log("Créditos consumidos, iniciando a chamada...");
      // Simula o fim da chamada após 5 segundos
      setTimeout(() => {
        toast.success("Chamada encerrada.");
        setIsCalling(false);
      }, 5000);
    } else {
      toast.error("Não foi possível debitar os créditos. Tente novamente.");
      setIsCalling(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <Button
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
        onClick={handleCallClick}
        disabled={isCalling}
      >
        {isCalling ? <Loader2 className="animate-spin" /> : <Phone />}
      </Button>
      
      {credits < VOICE_CALL_COST && !isCalling && (
        <div
          className="absolute inset-0 bg-black bg-opacity-30 rounded-full cursor-pointer flex items-center justify-center"
          onClick={onRequestVoiceCredits}
        >
          <ShieldAlert size={16} className="text-white" />
        </div>
      )}

      {!creditsLoading && (
        <span className="absolute -bottom-1 text-xs text-green-400 font-medium bg-[#1a1d29] px-1 rounded">
          {credits}
        </span>
      )}
    </div>
  );
};

export default VoiceCallButton;