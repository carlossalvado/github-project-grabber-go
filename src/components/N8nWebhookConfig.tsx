
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface N8nWebhookConfigProps {
  onWebhookConfigured?: (webhookUrl: string) => void;
}

const N8nWebhookConfig: React.FC<N8nWebhookConfigProps> = ({ onWebhookConfigured }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Por favor, insira a URL do webhook');
      return;
    }

    setIsTestingWebhook(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          message: 'Teste de conexão com N8N',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Webhook N8N configurado com sucesso!');
        onWebhookConfigured?.(webhookUrl);
      } else {
        toast.error('Erro ao testar webhook. Verifique a URL.');
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast.error('Erro de conexão com o webhook');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={20} />
          Configuração N8N
        </CardTitle>
        <CardDescription>
          Configure o webhook do N8N para processar áudio com Gemini e OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Webhook N8N</label>
          <Input
            placeholder="https://seu-n8n.app.n8n.cloud/webhook/audio-chat-gemini"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={testWebhook} 
          disabled={!webhookUrl || isTestingWebhook}
          className="w-full"
        >
          {isTestingWebhook ? 'Testando...' : 'Testar Webhook'}
        </Button>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <ExternalLink size={16} />
            Fluxo N8N Necessário
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            O fluxo JSON completo está disponível abaixo. Importe no seu N8N:
          </p>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Webhook recebe áudio/texto</li>
            <li>2. OpenAI Whisper transcreve áudio</li>
            <li>3. Gemini processa e responde</li>
            <li>4. OpenAI TTS gera áudio da resposta</li>
            <li>5. Retorna texto + áudio</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default N8nWebhookConfig;
