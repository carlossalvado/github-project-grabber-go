
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Phone, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreditsSelectionProps {
  onClose: () => void;
  onSelectAudioCredits: () => void;
  onSelectVoiceCredits: () => void;
}

const CreditsSelection: React.FC<CreditsSelectionProps> = ({ onClose }) => {
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);

  const handleAudioCreditsClick = async () => {
    try {
      setLoadingAudio(true);
      const { data, error } = await supabase.functions.invoke('create-paypal-audio-checkout');

      if (error) {
        console.error("Erro na function invoke:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
        onClose();
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error: any) {
      console.error('Erro ao processar compra de créditos de áudio:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleVoiceCreditsClick = async () => {
    try {
      setLoadingVoice(true);
      const { data, error } = await supabase.functions.invoke('create-paypal-voice-checkout');

      if (error) {
        console.error("Erro na function invoke:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
        onClose();
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error: any) {
      console.error('Erro ao processar compra de créditos de voz:', error);
      toast.error('Erro ao processar compra: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoadingVoice(false);
    }
  };

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
            onClick={handleAudioCreditsClick}
            disabled={loadingAudio || loadingVoice}
          >
            {loadingAudio ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <div className="text-left">
                  <div className="font-semibold">Processando...</div>
                  <div className="text-sm opacity-90">Redirecionando para o checkout</div>
                </div>
              </>
            ) : (
              <>
                <Mic size={24} />
                <div className="text-left">
                  <div className="font-semibold">Créditos de Áudio</div>
                  <div className="text-sm opacity-90">Para envio de mensagens de áudio</div>
                </div>
              </>
            )}
          </Button>
          
          <Button
            className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-3"
            onClick={handleVoiceCreditsClick}
            disabled={loadingAudio || loadingVoice}
          >
            {loadingVoice ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <div className="text-left">
                  <div className="font-semibold">Processando...</div>
                  <div className="text-sm opacity-90">Redirecionando para o checkout</div>
                </div>
              </>
            ) : (
              <>
                <Phone size={24} />
                <div className="text-left">
                  <div className="font-semibold">Créditos de Chamada de Voz</div>
                  <div className="text-sm opacity-90">Para chamadas de voz com IA</div>
                </div>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsSelection;
