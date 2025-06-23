
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PhoneOff, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceCallModalProps {
  isOpen: boolean;
  onEndCall: () => void;
  agentName: string;
  agentAvatar: string;
  isConnected: boolean;
  isSpeaking: boolean;
  isConnecting: boolean;
}

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onEndCall,
  agentName,
  agentAvatar,
  isConnected,
  isSpeaking,
  isConnecting
}) => {
  const getStatusText = () => {
    if (isConnecting) return 'Conectando...';
    if (isConnected && isSpeaking) return 'Falando...';
    if (isConnected) return 'Conectado';
    return 'Desconectado';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-400';
    if (isConnected) return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm w-full bg-gray-900 border-gray-700 text-white p-8 rounded-3xl">
        <div className="flex flex-col items-center space-y-6">
          {/* Avatar com animação de pulso quando falando */}
          <div className="relative">
            <Avatar className={cn(
              "h-32 w-32 border-4 transition-all duration-300",
              isSpeaking ? "border-green-400 animate-pulse" : "border-gray-600"
            )}>
              <AvatarImage src={agentAvatar} alt={agentName} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                {agentName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Indicador de microfone */}
            {isConnected && (
              <div className={cn(
                "absolute -bottom-2 -right-2 p-2 rounded-full",
                isSpeaking ? "bg-green-500" : "bg-gray-600"
              )}>
                {isSpeaking ? (
                  <Mic size={16} className="text-white" />
                ) : (
                  <MicOff size={16} className="text-white" />
                )}
              </div>
            )}
          </div>

          {/* Nome do agente */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">{agentName}</h2>
            <p className={cn("text-sm", getStatusColor())}>
              {getStatusText()}
            </p>
          </div>

          {/* Botão de encerrar chamada */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="bg-red-500 hover:bg-red-600 rounded-full h-16 w-16 p-0"
            disabled={isConnecting}
          >
            <PhoneOff size={24} />
          </Button>

          {/* Indicador de conexão */}
          {isConnecting && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm text-gray-400">Estabelecendo conexão...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCallModal;
