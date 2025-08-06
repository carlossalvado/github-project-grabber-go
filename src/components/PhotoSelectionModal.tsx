import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Lock } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface AgentPhoto {
  id: string;
  photo_url: string;
  thumbnail_url?: string | null;
  credit_cost: number;
}

interface PhotoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSend: (photo: AgentPhoto) => void;
  agentId: string;
}

const PhotoSelectionModal: React.FC<PhotoSelectionModalProps> = ({ isOpen, onClose, onPhotoSend, agentId }) => {
  const [photos, setPhotos] = useState<AgentPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const { credits } = useCredits();

  useEffect(() => {
    if (isOpen && agentId) {
      const fetchPhotos = async () => {
        setLoading(true);
        try {
          // Fazendo query SQL direta para acessar a tabela agent_photos
          const { data, error } = await supabase.rpc('get_agent_photos', { 
            p_agent_id: agentId 
          });

          if (error) {
            // Se a função não existir, vamos criar uma consulta alternativa
            console.error("Erro com função RPC:", error);
            throw new Error("Não foi possível carregar as fotos. Tente novamente.");
          }
          
          if (data) {
            setPhotos(data);
          }
        } catch (error) {
          console.error("Erro ao buscar fotos:", error);
          toast.error("Não foi possível carregar as fotos.");
        } finally {
          setLoading(false);
        }
      };
      fetchPhotos();
    }
  }, [isOpen, agentId]);

  const handleSelectPhoto = (photo: AgentPhoto) => {
    if (credits < photo.credit_cost) {
      toast.error("Créditos insuficientes!", {
        description: `Você precisa de ${photo.credit_cost} créditos, mas só tem ${credits}.`,
      });
      return;
    }
    onPhotoSend(photo);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Galeria de Fotos Exclusivas</DialogTitle>
          <DialogDescription>
            Escolha uma foto para desbloquear com seus créditos.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              Nenhuma foto disponível para este agente.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all duration-300"
                  onClick={() => handleSelectPhoto(photo)}
                >
                  <img
                    src={photo.thumbnail_url || photo.photo_url}
                    alt="Foto exclusiva"
                    className="w-full h-full object-cover filter blur-md group-hover:blur-sm transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 flex flex-col justify-end items-center p-2 text-center transition-all duration-300">
                    <div className="flex items-center gap-1 bg-black bg-opacity-60 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3 text-pink-400" />
                      <span className="text-white font-bold text-sm">{photo.credit_cost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoSelectionModal;