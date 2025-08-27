import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Bell, BellOff, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PushNotificationsPage: React.FC = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    subscription,
    error,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = usePushNotifications();

  const handleEnableNotifications = async () => {
    if (permission === 'default') {
      await requestPermission();
    } else if (permission === 'granted' && !isSubscribed) {
      await subscribeToPush();
    }
  };

  const handleDisableNotifications = async () => {
    await unsubscribeFromPush();
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Permitido</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Negado</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const getSubscriptionStatus = () => {
    if (!isSupported) return 'Não suportado';
    if (permission !== 'granted') return 'Permissão necessária';
    return isSubscribed ? 'Ativo' : 'Inativo';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notificações Push</h1>
        <p className="text-gray-600">Gerencie suas notificações push para receber atualizações do Isa Date</p>
      </div>

      {!isSupported && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <p>Seu navegador não suporta notificações push. Tente usar um navegador moderno como Chrome, Firefox ou Edge.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Status das Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Status das Notificações
            </CardTitle>
            <CardDescription>
              Veja o status atual das suas notificações push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Suporte do navegador:</span>
              {isSupported ? (
                <Badge variant="default" className="bg-green-500">Suportado</Badge>
              ) : (
                <Badge variant="destructive">Não suportado</Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span>Permissão:</span>
              {getPermissionBadge()}
            </div>

            <div className="flex justify-between items-center">
              <span>Inscrição:</span>
              <Badge variant={isSubscribed ? "default" : "secondary"}>
                {getSubscriptionStatus()}
              </Badge>
            </div>

            {subscription && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Endpoint da inscrição:</p>
                <p className="text-xs text-gray-500 break-all">{subscription.endpoint}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
            <CardDescription>
              Ative ou desative as notificações push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permission === 'default' && (
              <Button
                onClick={handleEnableNotifications}
                className="w-full"
                disabled={!isSupported}
              >
                <Bell className="w-4 h-4 mr-2" />
                Solicitar Permissão para Notificações
              </Button>
            )}

            {permission === 'granted' && !isSubscribed && (
              <Button
                onClick={handleEnableNotifications}
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Ativar Notificações Push
              </Button>
            )}

            {isSubscribed && (
              <Button
                onClick={handleDisableNotifications}
                variant="outline"
                className="w-full"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Desativar Notificações Push
              </Button>
            )}

            {permission === 'granted' && (
              <Button
                onClick={sendTestNotification}
                variant="secondary"
                className="w-full"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Enviar Notificação de Teste
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• As notificações push permitem que você receba mensagens mesmo quando o app não está aberto</li>
              <li>• Você pode receber lembretes, atualizações e mensagens importantes</li>
              <li>• As notificações respeitam suas configurações de privacidade</li>
              <li>• Você pode desativar as notificações a qualquer momento</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PushNotificationsPage;