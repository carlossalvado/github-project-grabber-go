import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BuyerInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BuyerInfoForm: React.FC<BuyerInfoFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        setIsFetching(true);
        try {
          const { data, error } = await supabase.from('profiles').select('full_name, cpf, phone').eq('id', user.id).single();
          if (error && error.code !== 'PGRST116') throw error;
          if (data) {
            setFullName(data.full_name || '');
            setCpf(data.cpf || '');
            setPhone(data.phone || '');
          }
        } catch (error) { toast.error("Não foi possível carregar suas informações."); } 
        finally { setIsFetching(false); }
      };
      fetchProfile();
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !cpf.trim() || !phone.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), cpf: cpf.trim(), phone: phone.trim() }).eq('id', user.id);
      if (error) throw error;
      toast.success("Informações salvas com sucesso!");
      onSuccess();
    } catch (error) { toast.error("Ocorreu um erro ao salvar suas informações."); } 
    finally { setLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1d29] border-blue-800/30 text-white">
        <DialogHeader>
          <DialogTitle>Informações para Pagamento</DialogTitle>
          <DialogDescription>Precisamos destes dados para processar seu pagamento com segurança.</DialogDescription>
        </DialogHeader>
        {isFetching ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" className="bg-[#2F3349] border-blue-800/50" disabled={loading} />
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF (000.000.000-00)" className="bg-[#2F3349] border-blue-800/50" disabled={loading} />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Celular ((00) 00000-0000)" className="bg-[#2F3349] border-blue-800/50" disabled={loading} />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar e Continuar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default BuyerInfoForm;