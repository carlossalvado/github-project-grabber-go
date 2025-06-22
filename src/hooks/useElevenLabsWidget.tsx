
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
    console.log('Encerrando chamada - removendo widget');
    
    // Remove o widget do DOM
    const widget = document.querySelector('elevenlabs-convai');
    if (widget) {
      console.log('Widget encontrado, removendo...');
      widget.remove();
    } else {
      console.log('Widget não encontrado no DOM');
    }
    
    // Remove todos os widgets que possam existir
    const allWidgets = document.querySelectorAll('elevenlabs-convai');
    allWidgets.forEach(w => w.remove());
    
    // Força a limpeza de qualquer conteúdo relacionado ao widget
    const shadowRoots = document.querySelectorAll('*');
    shadowRoots.forEach(element => {
      if (element.shadowRoot) {
        const convaiElements = element.shadowRoot.querySelectorAll('elevenlabs-convai');
        convaiElements.forEach(el => el.remove());
      }
    });
    
    setIsWidgetActive(false);
    toast.info('Chamada de voz encerrada');
    console.log('Chamada encerrada - widget removido');
  }, []);

  return {
    isWidgetActive,
    isLoading,
    initializeWidget,
    endCall
  };
};
