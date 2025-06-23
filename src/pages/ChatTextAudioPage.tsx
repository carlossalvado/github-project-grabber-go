
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatContainer from "@/components/ChatContainer";

const ChatTextAudioPage = () => {
  const navigate = useNavigate();

  console.log('ChatTextAudioPage - Página carregada');

  const handleBack = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-white hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl font-semibold text-white">Chat Text & Audio</h1>
      </div>
      
      <ChatContainer
        agentId="text-audio-agent"
        nickname="Assistente Text & Audio"
        agentAvatar="/placeholder.svg"
        subscription={null}
        hasPremiumFeatures={true}
        hasAudioFeature={true}
      />
    </div>
  );
};

export default ChatTextAudioPage;
