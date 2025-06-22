
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useElevenLabsWidget = () => {
  const [isWidgetActive, setIsWidgetActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initializeWidget = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-widget', {
        body: { action: 'get-widget-config' }
      });

      if (error) throw error;

      // Adiciona o script dinamicamente
      const existingScript = document.querySelector('script[src="' + data.scriptSrc + '"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = data.scriptSrc;
        script.async = true;
        script.type = 'text/javascript';
        document.head.appendChild(script);
      }

      // Cria o elemento do widget
      const existingWidget = document.querySelector('elevenlabs-convai');
      if (!existingWidget) {
        const widget = document.createElement('elevenlabs-convai');
        widget.setAttribute('agent-id', data.agentId);
        widget.style.position = 'fixed';
        widget.style.zIndex = '9999';
        widget.style.top = '50%';
        widget.style.left = '50%';
        widget.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(widget);
      }

      setIsWidgetActive(true);
      toast.success('Chamada de voz iniciada!');
    } catch (error) {
      console.error('Erro ao inicializar widget:', error);
      toast.error('Erro ao iniciar chamada de voz');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endCall = useCallback(() => {
    // Remove o widget
    const widget = document.querySelector('elevenlabs-convai');
    if (widget) {
      widget.remove();
    }
    
    setIsWidgetActive(false);
    toast.info('Chamada de voz encerrada');
  }, []);

  return {
    isWidgetActive,
    isLoading,
    initializeWidget,
    endCall
  };
};
