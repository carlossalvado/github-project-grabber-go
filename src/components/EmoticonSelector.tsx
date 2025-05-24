
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
  // Emoticons gratuitos organizados por categorias
  const freeEmoticons = [
    // Rostos felizes
    '😊', '😂', '🤣', '😍', '🥰', '😘', '😗', '😙', '😚',
    '🙂', '🤗', '😉', '😌', '🥳', '😎', '🤓', '🧐', 
    
    // Rostos neutros/pensativos
    '🤔', '🤭', '🤫', '🤐', '😐', '😑', '😶', '🙄',
    
    // Rostos tristes/preocupados
    '😔', '😪', '😕', '😟', '🙁', '☹️', '😮', '😯',
    '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
    '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩',
    '😫', '🥱', '😤', '😡', '🤬', '😠',
    
    // Especiais
    '🤡', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃',
    
    // Animais
    '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
    
    // Corações
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝',
    
    // Gestos
    '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋',
    '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲',
    '🤝', '🙏', '✍️', '💪', '🦾',
    
    // Símbolos
    '🔥', '⭐', '🌟', '✨', '⚡', '💫', '🌈', '☀️',
    '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗',
    '🌘', '🌑', '🌒', '🌓', '🌔'
  ];
  
  // Emoticons premium (presentes e especiais)
  const premiumEmoticons = [
    '🎁', '💝', '💎', '🏆', '👑', '🌹', '🍰', '🧸', 
    '💐', '🍫', '🥂', '🍾', '💍', '⌚', '👗', '👠', 
    '💄', '💋', '🌺', '🌷', '🎂', '🍭', '🍬', '🎈', 
    '🎊', '🎉', '🏅', '🥇', '🎖️', '🏵️', '💒', '🎪',
    '🎨', '🎭', '🎪', '🎯', '🎲', '🎰', '🎳', '🎮'
  ];
  
  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700 max-h-80 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-white">Emoticons</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-8 gap-3 mb-6">
        {freeEmoticons.map((emoticon, index) => (
          <button
            key={`${emoticon}-${index}`}
            className="text-2xl hover:bg-gray-700 p-2 rounded-lg transition-all hover:scale-110 transform duration-150 flex items-center justify-center h-12 w-12"
            onClick={() => onSelect(emoticon)}
          >
            {emoticon}
          </button>
        ))}
      </div>
      
      {hasPremiumEmoticons ? (
        <div className="mt-6">
          <div className="text-sm font-medium text-white mb-4 flex items-center">
            <span className="mr-2">Emoticons Premium</span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">Premium</span>
          </div>
          <div className="grid grid-cols-8 gap-3">
            {premiumEmoticons.map((emoticon, index) => (
              <button
                key={`premium-${emoticon}-${index}`}
                className="text-2xl hover:bg-gray-700 p-2 rounded-lg transition-all hover:scale-110 transform duration-150 flex items-center justify-center h-12 w-12"
                onClick={() => onSelect(emoticon)}
              >
                {emoticon}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <div className="text-center">
            <div className="text-purple-400 text-2xl mb-2">✨</div>
            <p className="text-sm text-gray-300 mb-2">
              Desbloqueie emoticons premium
            </p>
            <p className="text-xs text-gray-400">
              Upgrade para um plano <span className="font-medium text-purple-400">Premium</span> para acessar mais emoticons
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmoticonSelector;
