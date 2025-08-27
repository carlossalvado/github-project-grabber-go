import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Bell, BellOff, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PushNotificationManagerProps {
  compact?: boolean;
  showSettings?: boolean;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  compact = false,
  showSettings = true
}) => {
  const navigate = useNavigate();
  const {
    isSupported,
    isSubscribed,
    permission,
    error,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (permission === 'default') {
      await requestPermission();
    } else if (permission === 'granted' && !isSubscribed) {
      await subscribeToPush();
    } else if (isSubscribed) {
      await unsubscribeFromPush();
    }
  };

  const handleGoToSettings = () => {
    navigate('/notifications');
  };

  if (!isSupported) {
    return null; // Não mostrar nada se não for suportado
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <Button
            onClick={handleToggleNotifications}
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <Bell className="w-4 h-4 mr-1" />
            Ativo
          </Button>
        ) : (
          <Button
            onClick={handleToggleNotifications}
            variant="outline"
            size="sm"
          >
            <BellOff className="w-4 h-4 mr-1" />
            Ativar
          </Button>
        )}

        {showSettings && (
          <Button
            onClick={handleGoToSettings}
            variant="ghost"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-green-600">
                <Bell className="w-5 h-5" />
                <span className="font-medium">Notificações Ativas</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <BellOff className="w-5 h-5" />
                <span className="font-medium">Notificações Inativas</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleNotifications}
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
            >
              {permission === 'default' ? 'Permitir' :
               permission === 'granted' && !isSubscribed ? 'Ativar' :
               isSubscribed ? 'Desativar' : 'Permitir'}
            </Button>

            {showSettings && (
              <Button
                onClick={handleGoToSettings}
                variant="ghost"
                size="sm"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        {permission === 'denied' && (
          <p className="text-sm text-orange-600 mt-2">
            Permissão negada. Você pode alterar isso nas configurações do navegador.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;