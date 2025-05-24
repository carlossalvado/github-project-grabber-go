
import React from 'react';
import { X } from 'lucide-react';

interface EmoticonSelectorProps {
  onSelect: (emoticon: string) => void;
  onClose: () => void;
}

const EmoticonSelector: React.FC<EmoticonSelectorProps> = ({ 
  onSelect, 
  onClose
}) => {
  // Emoticons organizados por categorias
  const emoticons = [
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
    
    // Símbolos e Presentes
    '🔥', '⭐', '🌟', '✨', '⚡', '💫', '🌈', '☀️',
    '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗',
    '🌘', '🌑', '🌒', '🌓', '🌔', '🎁', '💝', '💎', 
    '🏆', '👑', '🌹', '🍰', '🧸', '💐', '🍫', '🥂', 
    '🍾', '💍', '⌚', '👗', '👠', '💄', '💋', '🌺', 
    '🌷', '🎂', '🍭', '🍬', '🎈', '🎊', '🎉', '🏅', 
    '🥇', '🎖️', '🏵️', '💒', '🎪', '🎨', '🎭', '🎯', 
    '🎲', '🎰', '🎳', '🎮'
  ];
  
  return (
    <div className="bg-gray-800 border-t border-gray-700 rounded-t-3xl shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">😊</span>
          Emoticons
        </h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Search bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar emoticons..."
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-full px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex gap-2 p-4 border-b border-gray-700 overflow-x-auto">
        {[
          { emoji: '😊', label: 'Rostos' },
          { emoji: '❤️', label: 'Corações' },
          { emoji: '👋', label: 'Gestos' },
          { emoji: '🎁', label: 'Presentes' },
          { emoji: '🔥', label: 'Símbolos' },
          { emoji: '😺', label: 'Animais' }
        ].map((category) => (
          <button
            key={category.label}
            className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="text-lg">{category.emoji}</span>
            <span className="text-xs text-gray-400">{category.label}</span>
          </button>
        ))}
      </div>
      
      {/* Emoticons grid */}
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-8 gap-2">
          {emoticons.map((emoticon, index) => (
            <button
              key={`${emoticon}-${index}`}
              className="text-2xl hover:bg-gray-700 p-3 rounded-lg transition-all hover:scale-110 transform duration-150 flex items-center justify-center h-12 w-12"
              onClick={() => onSelect(emoticon)}
            >
              {emoticon}
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-750">
        <div className="text-center text-sm text-gray-400">
          Clique em um emoticon para adicionar à sua mensagem
        </div>
      </div>
    </div>
  );
};

export default EmoticonSelector;
