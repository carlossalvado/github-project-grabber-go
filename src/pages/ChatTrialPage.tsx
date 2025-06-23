
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatContainer from "@/components/ChatContainer";
import { useTrialExpiredModal } from "@/hooks/useTrialExpiredModal";
import TrialExpiredModal from "@/components/TrialExpiredModal";

const ChatTrialPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ id: string; content: string; isUser: boolean; timestamp: Date }>>([]);
  const { showTrialExpiredModal, closeTrialExpiredModal } = useTrialExpiredModal();

  console.log('ChatTrialPage - Modal state:', { showTrialExpiredModal });

  const handleBack = () => {
    navigate('/profile');
  };

  const addMessage = (content: string, isUser: boolean) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
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
        <h1 className="text-xl font-semibold text-white">Chat Trial</h1>
      </div>
      
      <ChatContainer
        messages={messages}
        onSendMessage={addMessage}
        chatType="trial"
      />

      {/* Apenas renderizar o modal se showTrialExpiredModal for true */}
      {showTrialExpiredModal && (
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={closeTrialExpiredModal}
        />
      )}
    </div>
  );
};

export default ChatTrialPage;
