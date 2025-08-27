import React from 'react';
import { Button } from './ui/button';
import { Download, Smartphone } from 'lucide-react';

interface MobileInstallButtonProps {
  onInstall: () => void;
  isInstalling?: boolean;
  browserName: string;
}

const MobileInstallButton: React.FC<MobileInstallButtonProps> = ({
  onInstall,
  isInstalling = false,
  browserName
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Fundo semi-transparente */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Conteúdo do botão */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4 pointer-events-auto">
        {/* Ícone */}
        <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Instalar Isa Date
        </h3>

        {/* Descrição */}
        <p className="text-gray-600 text-sm mb-6">
          Instale o app para uma experiência melhor no seu {browserName}
        </p>

        {/* Botão de instalação */}
        <Button
          onClick={onInstall}
          disabled={isInstalling}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-xl text-base"
        >
          {isInstalling ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Instalando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MobileInstallButton;