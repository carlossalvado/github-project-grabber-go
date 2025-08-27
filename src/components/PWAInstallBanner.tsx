import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface PWAInstallBannerProps {
  isVisible: boolean;
  onInstall: () => void;
  onClose: () => void;
  isInstalling?: boolean;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  isVisible,
  onInstall,
  onClose,
  isInstalling = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Fundo semi-transparente */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Conteúdo do banner */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-8 text-center transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Ícone do app */}
        <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Smartphone className="w-10 h-10 text-white" />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Instale o Isa Date
        </h2>

        {/* Descrição */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Tenha uma experiência ainda melhor! Instale nosso app para acessar rapidamente,
          receber notificações e usar offline.
        </p>

        {/* Benefícios */}
        <div className="space-y-2 mb-8 text-left">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Acesso rápido direto da tela inicial</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Notificações push instantâneas</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Funcionamento offline</span>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Button
            onClick={onInstall}
            disabled={isInstalling}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Instalando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </>
            )}
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700 py-2"
          >
            Talvez Depois
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;