import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Phone, X } from 'lucide-react';
import PixCheckoutButton from '@/components/PixCheckoutButton';

const CreditsSelection = ({ onClose }) => {
  const [selectedType, setSelectedType] = useState('audio'); // 'audio' ou 'voice'
  const [selectedAmount, setSelectedAmount] = useState(null);

  const audioOptions = [
    { amount: 100, price: 10 },
    { amount: 250, price: 20 },
    { amount: 500, price: 35 },
  ];

  const voiceOptions = [
    { amount: 50, price: 10 },
    { amount: 120, price: 20 },
    { amount: 250, price: 35 },
  ];

  const options = selectedType === 'audio' ? audioOptions : voiceOptions;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#1a1d29] border border-blue-800/30 rounded-2xl w-full max-w-md flex flex-col text-white">
        <div className="flex justify-between items-center p-4 border-b border-blue-800/30">
          <h3 className="text-lg font-semibold">Comprar Créditos</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-4 bg-[#2F3349] p-1 rounded-lg">
            <Button
              onClick={() => { setSelectedType('audio'); setSelectedAmount(null); }}
              className={`w-full ${selectedType === 'audio' ? 'bg-blue-600' : 'bg-transparent text-blue-200'}`}
            >
              <Mic className="mr-2 h-4 w-4" /> Áudio
            </Button>
            <Button
              onClick={() => { setSelectedType('voice'); setSelectedAmount(null); }}
              className={`w-full ${selectedType === 'voice' ? 'bg-blue-600' : 'bg-transparent text-blue-200'}`}
            >
              <Phone className="mr-2 h-4 w-4" /> Voz
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {options.map((option) => (
              <button
                key={option.amount}
                onClick={() => setSelectedAmount(option.amount)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  selectedAmount === option.amount 
                    ? 'border-blue-500 bg-blue-900/50' 
                    : 'border-blue-800/50 hover:border-blue-400'
                }`}
              >
                <div className="text-xl font-bold">{option.amount}</div>
                <div className="text-sm text-blue-300">R$ {option.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-blue-800/30">
          <PixCheckoutButton
            checkoutType={selectedType === 'audio' ? 'audio' : 'voice'}
            amount={selectedAmount}
            className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-3"
            disabled={!selectedAmount}
          >
            {selectedAmount 
              ? `Pagar com PIX` 
              : 'Selecione um pacote'}
          </PixCheckoutButton>
        </div>
      </div>
    </div>
  );
};

export default CreditsSelection;