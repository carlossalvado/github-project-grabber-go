// src/components/CpfUpdateModal.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CpfUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CpfUpdateModal: React.FC<CpfUpdateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [cpf, setCpf] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Função para formatar o CPF com máscara
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos de novo (para o segundo bloco)
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca um hífen entre o terceiro e o quarto dígitos
      .substring(0, 14); // Limita o tamanho
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar seu CPF.');
      return;
    }
    if (cpf.length !== 14) {
      toast.error('Por favor, insira um CPF válido.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cpf_cnpj: cpf.replace(/\D/g, '') }) // Salva apenas os números
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('CPF atualizado com sucesso!');
      onSuccess(); // Chama a função de sucesso para tentar a compra novamente
      onClose();   // Fecha o modal
    } catch (error: any) {
      console.error('Erro ao atualizar CPF:', error);
      toast.error('Não foi possível atualizar o CPF. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-red-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-red-400">CPF Inválido</DialogTitle>
          <DialogDescription className="text-gray-400">
            O CPF cadastrado em sua conta é inválido. Por favor, corrija-o abaixo para continuar com a compra.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              className="input-isa"
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full btn-isa-primary">
            {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar e Tentar Novamente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CpfUpdateModal;