import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

// Função para detectar se o dispositivo é móvel
const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768 && window.innerHeight <= 1024;

  console.log('🔍 Detecção de dispositivo:', {
    userAgent,
    isMobile,
    isSmallScreen,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    result: isMobile || isSmallScreen
  });

  return isMobile || isSmallScreen;
};

// Função para detectar navegador específico
const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('Edg')) {
    return 'Edge';
  } else {
    return 'Unknown';
  }
};

// Função para verificar se o navegador é suportado para PWA
const isSupportedBrowser = (): boolean => {
  const browser = getBrowserName();
  const supportedBrowsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];

  console.log('🌐 Detecção de navegador:', {
    browser,
    userAgent: navigator.userAgent,
    isSupported: supportedBrowsers.includes(browser)
  });

  return supportedBrowsers.includes(browser);
};

// Função para verificar se o PWA já está instalado
const isPWAInstalled = (): boolean => {
  // Verificar se está rodando no modo standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Verificar se está rodando como app instalado
  const isInWebAppiOS = (window.navigator as any).standalone === true;

  console.log('📱 Status de instalação PWA:', {
    isStandalone,
    isInWebAppiOS,
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
  });

  return isStandalone || isInWebAppiOS;
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showMobileButton, setShowMobileButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [browserName, setBrowserName] = useState('');
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(false);

  useEffect(() => {
    // Detectar se é dispositivo móvel
    const mobile = isMobileDevice();
    setIsMobile(mobile);

    // Detectar navegador
    const browser = getBrowserName();
    setBrowserName(browser);

    // Verificar se o navegador é suportado
    const supported = (() => {
      const browser = getBrowserName();
      const supportedBrowsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      return supportedBrowsers.includes(browser);
    })();
    setIsSupportedBrowser(supported);

    // Verificar se já está instalado
    const installed = isPWAInstalled();
    setIsInstalled(installed);

    console.log('🚀 Inicializando PWA Install Hook:', {
      isMobile: mobile,
      browser,
      isSupportedBrowser: supported,
      isInstalled: installed,
      userAgent: navigator.userAgent
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📢 Evento beforeinstallprompt disparado!');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Mostrar botão móvel centralizado em dispositivos móveis com navegadores suportados (apenas se não estiver instalado)
      if (mobile && !installed && supported) {
        console.log('📱 Mostrando botão móvel de instalação para dispositivo móvel com navegador suportado...');
        setTimeout(() => {
          setShowMobileButton(true);
        }, 2000); // Pequeno delay antes de mostrar o botão
      } else {
        console.log('⏸️ Botão móvel não mostrado:', {
          isMobile: mobile,
          isInstalled: installed,
          isSupportedBrowser: supported
        });
      }
    };

    const handleAppInstalled = () => {
      console.log('🎉 PWA instalado com sucesso!');
      // Hide the install button when the app is installed
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    // Aguardar o service worker estar pronto antes de adicionar listeners
    const initPWAListeners = async () => {
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
          console.log('🔧 Service Worker pronto, adicionando listeners PWA');

          window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          window.addEventListener('appinstalled', handleAppInstalled);
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar listeners PWA:', error);
      }
    };

    initPWAListeners();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('❌ Nenhum prompt de instalação disponível');
      return;
    }

    console.log('🚀 Mostrando prompt de instalação...');
    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou o prompt de instalação');
        setShowBanner(false);
        setShowMobileButton(false);
      } else {
        console.log('❌ Usuário rejeitou o prompt de instalação');
      }
    } catch (error) {
      console.error('❌ Erro ao mostrar prompt de instalação:', error);
    } finally {
      setIsInstalling(false);
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const closeBanner = () => {
    console.log('🚪 Fechando banner de instalação');
    setShowBanner(false);
  };

  const closeMobileButton = () => {
    console.log('🚪 Fechando botão móvel de instalação');
    setShowMobileButton(false);
  };

  const showInstallBanner = () => {
    if (canInstallPWA()) {
      console.log('📱 Mostrando banner de instalação manualmente');
      setShowBanner(true);
    }
  };

  // Função para verificar se o PWA pode ser instalado
  const canInstallPWA = (): boolean => {
    return isInstallable && !isInstalled && isMobile && isSupportedBrowser;
  };

  return {
    isInstallable,
    installPWA,
    isMobile,
    isInstalled,
    canInstallPWA,
    showBanner,
    closeBanner,
    showMobileButton,
    closeMobileButton,
    showInstallBanner,
    isInstalling,
    browserName,
    isSupportedBrowser,
  };
};