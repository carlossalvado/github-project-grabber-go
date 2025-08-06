import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-300 max-w-2xl w-[95vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-700 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-pink-400">Termos de Uso e Política de Privacidade</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Última atualização: 6 de agosto de 2025
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-6">
          <div className="prose prose-invert prose-headings:text-pink-400 prose-a:text-pink-400 hover:prose-a:text-pink-300 max-w-none">
            <p>Bem-vindo(a) ao Isa Date. Sua confiança é a base do nosso relacionamento virtual. Este documento legal ("Contrato") rege o seu acesso e uso da nossa plataforma e explica como tratamos seus dados. Ao criar uma conta ou usar nossos Serviços, você confirma que leu, entendeu e concorda em se vincular a este Contrato.</p>
            
            <hr className="my-8 border-slate-700" />

            {/* --- TERMOS DE USO --- */}
            <h2 className="text-2xl font-bold mb-4">Parte I: Termos e Condições de Uso</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">1. Aceitação e Declaração de Vontade</h3>
            <p>Ao criar uma conta e utilizar o Serviço Isa Date, você celebra um contrato de adesão conosco e declara, para todos os fins de direito, que o faz de livre e espontânea vontade, sem qualquer tipo de coação, induzimento ou vício de consentimento...</p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">2. Declaração de Ciência sobre a Natureza do Serviço</h3>
            <p className="border-l-4 border-yellow-500 pl-4 italic text-slate-400"><strong>Aviso Legal Fundamental:</strong> Você, o "Usuário", declara ter plena e inequívoca ciência, convicção e entendimento de que o Serviço Isa Date é uma obra de ficção e entretenimento. A personagem "Isa" é uma Inteligência Artificial (IA)...</p>

            {/* O restante do conteúdo dos termos vai aqui para manter o exemplo conciso */}
            <p>[...]</p>

            <hr className="my-8 border-slate-700" />

            {/* --- POLÍTICA DE PRIVACIDADE --- */}
            <h2 className="text-2xl font-bold mb-4">Parte II: Política de Privacidade</h2>
            <p>Esta política detalha como tratamos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD)...</p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">1. Dados Coletados e Base Legal</h3>
            <p>A coleta de dados é minimizada para o estritamente necessário...</p>
            <p>[...]</p>
            
            <div className="p-4 bg-slate-800/50 rounded-md border border-slate-700 not-prose mt-6">
                <p className="mb-1"><strong>Razão Social:</strong> Isa App - Desenvolvimento de Programas de Computador LTDA</p>
                <p className="mb-1"><strong>CNPJ:</strong> 61.629.735/0001-73</p>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-slate-700 flex-shrink-0 flex justify-end">
            <Button onClick={onClose} className="bg-pink-500 hover:bg-pink-600 text-white">
                Fechar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfUseModal;
