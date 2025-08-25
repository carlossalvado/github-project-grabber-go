import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, CheckCircle, ShieldX } from 'lucide-react';

interface BuyerInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  // A prop onSaveSuccess foi removida para manter seu código original, 
  // mas se precisar dela para o fluxo de compra, me avise.
  // Por ora, o botão apenas salva e fecha, como no seu código.
  onSaveSuccess: () => void;
}

// Função de validação de CPF
const isValidCPF = (cpf: string): boolean => {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const digits = cpf.split('').map(Number);

  const calcDigit = (slice: number[]): number => {
    let sum = 0;
    let multiplier = slice.length + 1;
    for (const digit of slice) {
      sum += digit * multiplier;
      multiplier--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 9));
  if (firstDigit !== digits[9]) return false;

  const secondDigit = calcDigit(digits.slice(0, 10));
  if (secondDigit !== digits[10]) return false;

  return true;
};

const BuyerInfoForm: React.FC<BuyerInfoFormProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCpfValidated, setIsCpfValidated] = useState(false);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Permite apenas números
      .substring(0, 11); // Limita a 11 dígitos
  };

  const displayFormattedCPF = (value: string) => {
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCpfValidated) {
      setIsCpfValidated(false);
    }
    setCpf(formatCPF(e.target.value));
  };

  const handleValidate = () => {
    if (isValidCPF(cpf)) {
      toast.success("CPF válido!", {
        icon: <CheckCircle className="text-green-500" />,
      });
      setIsCpfValidated(true);
    } else {
      toast.error("CPF inválido.", {
        icon: <ShieldX className="text-red-500" />,
      });
      setIsCpfValidated(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar as informações.");
      return;
    }
    if (!fullName || !cpf) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (!isCpfValidated) {
      toast.error("Por favor, valide seu CPF antes de continuar.");
      return;
    }

    setIsLoading(true);
    try {
      // ***** CHAMADA AO BANCO DE DADOS CORRIGIDA PARA USAR 'cpf' *****
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, cpf: cpf }) // Corrigido
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success("Informações salvas com sucesso!");
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao salvar informações: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
        setFullName('');
        setCpf('');
        setIsCpfValidated(false);
        setIsLoading(false);
    }
  }, [isOpen]);

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
            disabled={isCpfValidated}
          />
          <Input
            id="cpf"
            placeholder="CPF (apenas números)"
            value={displayFormattedCPF(cpf)} // Mostra formatado, mas salva só números
            onChange={handleCpfChange}
            className="bg-[#1a1d29] border-blue-800/50 text-white"
            disabled={isCpfValidated}
            maxLength={14}
          />
        </div>
        <DialogFooter>
          {!isCpfValidated ? (
            <Button onClick={handleValidate} className="bg-yellow-600 hover:bg-yellow-700">
              Validar CPF
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Continuar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyerInfoForm;