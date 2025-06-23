
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Importando os ícones das redes sociais do lucide-react
import { Facebook, Instagram } from 'lucide-react';

interface AgentData {
  id: string;
  name: string;
  avatar_url: string;
  bio?: string;
  tiktok_url?: string;
  kwai_url?: string;
  facebook_url?: string;
  instagram_url?: string;
}

interface AgentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

const AgentProfileModal: React.FC<AgentProfileModalProps> = ({
  isOpen,
  onClose,
  agentId
}) => {
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId || !isOpen) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', agentId)
          .single();

        if (error) {
          console.error('Erro ao buscar dados do agente:', error);
          return;
        }

        setAgentData(data);
      } catch (error) {
        console.error('Erro ao carregar perfil do agente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, isOpen]);

  const handleSocialClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Ícones customizados para TikTok e Kwai usando SVG
  const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-1.183-.11 6.44 6.44 0 0 0-6.5 6.4 6.443 6.443 0 0 0 11.5 4.087V8.862a8.25 8.25 0 0 0 5.416 2.049v-3.225a4.813 4.813 0 0 1-1 0z"/>
    </svg>
  );

  const KwaiIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1.5-1.5L11 13l-2.5-2.5L10 9l3 3-3 3zm5-3l-1.5 1.5L11 13l2.5-2.5L12 9l-3 3 3 3z"/>
    </svg>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-[#1a1d29] border border-blue-800/30 text-white">
        {/* Close Button */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-blue-200 hover:text-white hover:bg-blue-900/50 rounded-full"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </DialogClose>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : agentData ? (
          <div className="p-6 text-center">
            {/* Avatar - MADE LARGER */}
            <div className="mb-4">
              <Avatar className="w-40 h-40 mx-auto">
                <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
                <AvatarFallback className="bg-blue-800 text-white text-4xl">
                  {agentData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name */}
            <h2 className="text-2xl font-bold text-white mb-2">{agentData.name}</h2>

            {/* Bio */}
            {agentData.bio && (
              <p className="text-blue-200 text-sm mb-6 leading-relaxed">
                {agentData.bio}
              </p>
            )}

            {/* Social Media Links */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-300 mb-4">Redes Sociais</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {agentData.tiktok_url && (
                  <button
                    onClick={() => handleSocialClick(agentData.tiktok_url!)}
                    className="flex items-center gap-2 p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-800/50"
                  >
                    <TikTokIcon />
                    <span className="text-sm font-medium">TikTok</span>
                  </button>
                )}

                {agentData.kwai_url && (
                  <button
                    onClick={() => handleSocialClick(agentData.kwai_url!)}
                    className="flex items-center gap-2 p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-800/50"
                  >
                    <KwaiIcon />
                    <span className="text-sm font-medium">Kwai</span>
                  </button>
                )}

                {agentData.facebook_url && (
                  <button
                    onClick={() => handleSocialClick(agentData.facebook_url!)}
                    className="flex items-center gap-2 p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-800/50"
                  >
                    <Facebook size={20} />
                    <span className="text-sm font-medium">Facebook</span>
                  </button>
                )}

                {agentData.instagram_url && (
                  <button
                    onClick={() => handleSocialClick(agentData.instagram_url!)}
                    className="flex items-center gap-2 p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-800/50"
                  >
                    <Instagram size={20} />
                    <span className="text-sm font-medium">Instagram</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-blue-200">Erro ao carregar informações do perfil.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentProfileModal;
