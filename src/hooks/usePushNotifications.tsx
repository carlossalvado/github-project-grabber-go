import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  error: string | null;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    subscription: null,
    error: null,
  });

  useEffect(() => {
    // Verificar suporte
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setState(prev => ({ ...prev, isSupported }));

    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications não são suportadas neste navegador' }));
      return;
    }

    // Verificar permissão atual
    setState(prev => ({ ...prev, permission: Notification.permission }));

    // Aguardar o service worker ser registrado pelo vite-plugin-pwa
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service worker pronto para push notifications:', registration);
        setState(prev => ({ ...prev, error: null }));
      }).catch((error) => {
        console.error('Erro ao aguardar service worker:', error);
        setState(prev => ({ ...prev, error: 'Erro ao preparar service worker para notificações' }));
      });
    }
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribeToPush();
      }

      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setState(prev => ({ ...prev, error: 'Erro ao solicitar permissão para notificações' }));
      return 'denied';
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Chave VAPID - você precisará gerar uma chave real para produção
      const vapidPublicKey = 'BKxQzQc5r1z6p8z7w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8w8'; // Substitua por sua chave real

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        error: null
      }));

      // Salvar subscription localmente (por enquanto)
      // Em produção, isso seria enviado para o servidor
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : null,
          auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : null,
        },
        userAgent: navigator.userAgent,
        userEmail: user?.email || null,
        timestamp: Date.now()
      };

      localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
      console.log('Subscription salva localmente:', subscriptionData);

      return subscription;
    } catch (error) {
      console.error('Erro ao se inscrever para push:', error);
      setState(prev => ({ ...prev, error: 'Erro ao se inscrever para notificações push' }));
      return null;
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (state.subscription) {
        await state.subscription.unsubscribe();
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null,
          error: null
        }));
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      setState(prev => ({ ...prev, error: 'Erro ao cancelar inscrição' }));
    }
  };

  const sendTestNotification = () => {
    if (state.permission === 'granted') {
      new Notification('Teste de Notificação', {
        body: 'Esta é uma notificação de teste do Isa Date!',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else {
      setState(prev => ({ ...prev, error: 'Permissão para notificações não concedida' }));
    }
  };

  return {
    ...state,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  };
};

// Função auxiliar para converter chave VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}