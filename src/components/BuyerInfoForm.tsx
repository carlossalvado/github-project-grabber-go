import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BuyerInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void; // A prop que estava faltando
}

const BuyerInfoForm: React.FC<BuyerInfoFormProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Lógica para buscar dados existentes, se houver
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar as informações.");
      return;
    }
    if (!fullName || !cpf) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, cpf })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success("Informações salvas com sucesso!");
      onSaveSuccess(); // Chama a função de sucesso
      onClose(); // Fecha o modal
    } catch (error: any) {
      toast.error(`Erro ao salvar informações: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2F3349] border-blue-800/50 text-white">
        <DialogHeader>
          <DialogTitle>Informações do Comprador</DialogTitle>
          <DialogDescription>
            Precisamos do seu nome completo e CPF para gerar a cobrança, conforme exigido pelo Banco Central.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="fullName"
            placeholder="Nome Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-[#1a1d29] border-blue-800/50 text-white"
          />
          <Input
            id="cpf"
            placeholder="CPF (apenas números)"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="bg-[#1a1d29] border-blue-800/50 text-white"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyerInfoForm;