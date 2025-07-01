
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Phone, X } from 'lucide-react';

interface CreditsSelectionProps {
  onClose: () => void;
  onSelectAudioCredits: () => void;
  onSelectVoiceCredits: () => void;
}

const CreditsSelection: React.FC<CreditsSelectionProps> = ({
  onClose,
  onSelectAudioCredits,
  onSelectVoiceCredits
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
          <CardTitle className="text-center text-gray-800">
            Comprar Créditos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-3"
            onClick={onSelectAudioCredits}
          >
            <Mic size={24} />
            <div className="text-left">
              <div className="font-semibold">Créditos de Áudio</div>
              <div className="text-sm opacity-90">Para envio de mensagens de áudio</div>
            </div>
          </Button>
          
          <Button
            className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-3"
            onClick={onSelectVoiceCredits}
          >
            <Phone size={24} />
            <div className="text-left">
              <div className="font-semibold">Créditos de Chamada de Voz</div>
              <div className="text-sm opacity-90">Para chamadas de voz com IA</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsSelection;
