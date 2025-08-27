import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Send, Code, Server, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

const SendPushNotificationPage: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('Nova mensagem do Isa Date');
  const [body, setBody] = useState('Você recebeu uma nova mensagem! 💕');
  const [icon, setIcon] = useState('/favicon.ico');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendNotification = async () => {
    if (!user) {
      setError('Você precisa estar logado para enviar notificações');
      return;
    }

    if (user.email !== 'armempires@gmail.com') {
      setError('Apenas armempires@gmail.com pode enviar notificações push');
      return;
    }

    setIsSending(true);
    setResult(null);
    setError(null);

    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada');
      }

      // Enviar para a função Edge Function
      const response = await fetch('/functions/v1/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          body,
          icon,
          badge: icon,
          senderEmail: user.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar notificação');
      }

      setResult(data.message || 'Notificação enviada com sucesso!');

      // Limpar formulário
      setTitle('Nova mensagem do Isa Date');
      setBody('Você recebeu uma nova mensagem! 💕');
      setIcon('/favicon.ico');

    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      setError(error instanceof Error ? error.message : 'Erro ao enviar notificação');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enviar Notificações Push</h1>
        <p className="text-gray-600">Envie notificações push para usuários inscritos</p>
        {user && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Usuário logado:</strong> {user.email}
            </p>
            {user.email === 'armempires@gmail.com' ? (
              <p className="text-green-600 text-sm mt-1">✅ Você tem permissão para enviar notificações</p>
            ) : (
              <p className="text-red-600 text-sm mt-1">❌ Apenas armempires@gmail.com pode enviar notificações</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário de Envio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar Notificação
            </CardTitle>
            <CardDescription>
              Configure e envie uma notificação push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da notificação"
              />
            </div>

            <div>
              <Label htmlFor="body">Mensagem</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Conteúdo da notificação"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="icon">Ícone (URL)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="URL do ícone"
              />
            </div>

            <Button
              onClick={handleSendNotification}
              disabled={isSending || !user || user.email !== 'armempires@gmail.com'}
              className="w-full"
            >
              {isSending ? 'Enviando...' : 'Enviar Notificação'}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{result}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Implementação Técnica
            </CardTitle>
            <CardDescription>
              Como implementar o envio de notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">1. Configurar Servidor VAPID</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Você precisa de um servidor para enviar notificações push usando chaves VAPID.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard('npm install web-push')}
                  className="text-xs"
                >
                  Copiar comando
                </Button>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">2. Exemplo de Código Backend</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`const webpush = require('web-push');

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:seu-email@exemplo.com',
  'SUA_CHAVE_PUBLICA_VAPID',
  'SUA_CHAVE_PRIVADA_VAPID'
);

// Enviar notificação
app.post('/send-notification', async (req, res) => {
  const { subscription, title, body } = req.body;

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      body,
      icon: '/favicon.ico'
    }));
    res.status(200).send('Notificação enviada');
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao enviar');
  }
});`}
                  </pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`const webpush = require('web-push');

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:seu-email@exemplo.com',
  'SUA_CHAVE_PUBLICA_VAPID',
  'SUA_CHAVE_PRIVADA_VAPID'
);

// Enviar notificação
app.post('/send-notification', async (req, res) => {
  const { subscription, title, body } = req.body;

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      body,
      icon: '/favicon.ico'
    }));
    res.status(200).send('Notificação enviada');
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao enviar');
  }
});`)}
                  className="mt-2 text-xs"
                >
                  Copiar código
                </Button>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">3. Gerar Chaves VAPID</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`const vapidKeys = webpush.generateVAPIDKeys();
console.log('Chave Pública:', vapidKeys.publicKey);
console.log('Chave Privada:', vapidKeys.privateKey);`}
                  </pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`const vapidKeys = webpush.generateVAPIDKeys();
console.log('Chave Pública:', vapidKeys.publicKey);
console.log('Chave Privada:', vapidKeys.privateKey);`)}
                  className="mt-2 text-xs"
                >
                  Copiar código
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Passos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <p className="font-medium">Configurar servidor backend</p>
                <p className="text-sm text-gray-600">Implemente um endpoint para receber as inscrições dos usuários</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <p className="font-medium">Armazenar inscrições</p>
                <p className="text-sm text-gray-600">Salve as inscrições push no banco de dados</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <p className="font-medium">Implementar envio em massa</p>
                <p className="text-sm text-gray-600">Envie notificações para todos os usuários inscritos</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <p className="font-medium">Configurar VAPID</p>
                <p className="text-sm text-gray-600">Gere e configure suas chaves VAPID para produção</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendPushNotificationPage;