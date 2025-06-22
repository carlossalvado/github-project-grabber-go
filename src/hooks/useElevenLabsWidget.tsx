
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useElevenLabsWidget = () => {
  const [isWidgetActive, setIsWidgetActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const initializeWidget = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-widget', {
        body: { action: 'get-call-url' }
      });

      if (error) throw error;

      // Abre o popup com a URL do ElevenLabs
      const popup = window.open(
        data.url,
        'elevenlabs-call',
        'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );

      if (popup) {
        popupRef.current = popup;
        setIsWidgetActive(true);
        toast.success('Chamada de voz iniciada!');

        // Monitora se o popup foi fechado pelo usuário
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsWidgetActive(false);
            popupRef.current = null;
            toast.info('Chamada de voz encerrada');
          }
        }, 1000);
      } else {
        throw new Error('Popup foi bloqueado pelo navegador');
      }
    } catch (error) {
      console.error('Erro ao inicializar chamada:', error);
      toast.error('Erro ao iniciar chamada de voz. Verifique se popups estão permitidos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endCall = useCallback(() => {
    console.log('Encerrando chamada - fechando popup');
    
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      console.log('Popup fechado');
    }
    
    setIsWidgetActive(false);
    popupRef.current = null;
    toast.info('Chamada de voz encerrada');
    console.log('Chamada encerrada - popup fechado');
  }, []);

  return {
    isWidgetActive,
    isLoading,
    initializeWidget,
    endCall
  };
};
