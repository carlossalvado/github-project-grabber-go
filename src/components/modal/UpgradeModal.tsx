import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UPGRADE_COST = 20;

// O modal recebe as props para controlar se está aberto ou fechado.
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Toda a lógica que estava no botão original agora vive aqui, dentro do modal.
  const { user, profile, refreshProfile } = useAuth();
  const userCredits = profile?.audio_credits || 0;
  const navigate = useNavigate();

  const canAfford = userCredits >= UPGRADE_COST;

  const handleUpgradeConfirm = async () => {
    if (!user) return;
    if (!canAfford) {
      toast.error("Você não tem créditos suficientes.");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('upgrade_plan_with_credits', {
        p_user_id: user.id
      });

      if (error) throw new Error("Ocorreu um erro de comunicação.");

      if (data === 'SUCCESS') {
        toast.success("Plano atualizado com sucesso!");
        if (refreshProfile) await refreshProfile();
        navigate('/chat-text-audio');
      } else {
        throw new Error("Falha no servidor ao validar seus créditos.");
      }

    } catch (err: any) {
      toast.error("Falha ao atualizar o plano.", { description: err.message });
    } finally {
      setIsLoading(false);
      onClose(); // Fecha o modal independentemente do resultado
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upgrade para o Plano "Text & Audio"</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá consumir <span className="font-bold">{UPGRADE_COST} créditos</span> do seu saldo para ativar o plano.
            <br />
            Seu saldo atual é de <span className="font-bold">{userCredits}</span> créditos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {!canAfford && (
          <div className="flex items-center p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <XCircle className="flex-shrink-0 inline w-4 h-4 me-3" />
            <div>
              <span className="font-medium">Créditos insuficientes!</span> Você precisa de mais {UPGRADE_COST - userCredits} créditos para continuar.
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUpgradeConfirm} 
            disabled={!canAfford || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Contratar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};