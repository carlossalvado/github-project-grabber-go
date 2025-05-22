
import React from 'react';
import { X } from 'lucide-react';

interface EmoticonSelectorProps {
  onSelect: (emoticon: string) => void;
  onClose: () => void;
  hasPremiumEmoticons?: boolean;
}

const EmoticonSelector: React.FC<EmoticonSelectorProps> = ({ 
  onSelect, 
  onClose,
  hasPremiumEmoticons = false 
}) => {
  // Emoticons gratuitos
  const freeEmoticons = ['😊', '😂', '❤️', '👍', '🙏', '😍', '🥰', '😘', '😎', '🤩', '😢', '😭', '🤔', '🤗', '🤫'];
  
  // Emoticons premium (presentes)
  const premiumEmoticons = ['🎁', '💝', '💎', '🏆', '👑', '🌹', '🍰', '🧸', '💐', '🍫', '🥂'];
  
  return (
    <div className="p-3 border-t border-gray-200 bg-white shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Emoticons</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-10 gap-2">
        {freeEmoticons.map(emoticon => (
          <button
            key={emoticon}
            className="text-2xl hover:bg-gray-100 p-1 rounded-md transition-colors"
            onClick={() => onSelect(emoticon)}
          >
            {emoticon}
          </button>
        ))}
      </div>
      
      {hasPremiumEmoticons ? (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">Presentes Premium</span>
            <span className="bg-gradient-sweet text-white text-xs px-2 py-0.5 rounded">Premium</span>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {premiumEmoticons.map(emoticon => (
              <button
                key={emoticon}
                className="text-2xl hover:bg-gray-100 p-1 rounded-md transition-colors"
                onClick={() => onSelect(emoticon)}
              >
                {emoticon}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Desbloqueie emoticons premium com um plano <span className="font-medium text-pink-600">Premium</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default EmoticonSelector;
