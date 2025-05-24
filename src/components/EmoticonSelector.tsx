
import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

interface EmoticonSelectorProps {
  onSelect: (emoticon: string) => void;
  onClose: () => void;
}

const EmoticonSelector: React.FC<EmoticonSelectorProps> = ({ 
  onSelect, 
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchTerm, setSearchTerm] = useState('');

  // Categorias organizadas como WhatsApp/Telegram
  const categories = {
    smileys: {
      icon: '😊',
      label: 'Rostos',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '🫠', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️',
        '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗',
        '🤭', '🫢', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑',
        '😶', '🫥', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤',
        '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴',
        '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤',
        '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦',
        '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
        '😓', '😩', '😫', '🥱', '😤', '😡', '🤬', '😠', '🤯', '😈',
        '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
        '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
        '😾'
      ]
    },
    people: {
      icon: '👋',
      label: 'Pessoas',
      emojis: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
        '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
        '🫵', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '🫶',
        '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿',
        '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴',
        '👀', '👁️', '👅', '👄', '🫦', '👶', '🧒', '👦', '👧', '🧑',
        '👱', '👨', '🧔', '👩', '🧓', '👴', '👵'
      ]
    },
    animals: {
      icon: '🐶',
      label: 'Animais',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
        '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
        '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
        '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌',
        '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂'
      ]
    },
    food: {
      icon: '🍎',
      label: 'Comida',
      emojis: [
        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
        '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
        '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
        '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈',
        '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟'
      ]
    },
    activities: {
      icon: '⚽',
      label: 'Atividades',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
        '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
        '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
        '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗'
      ]
    },
    travel: {
      icon: '✈️',
      label: 'Viagem',
      emojis: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
        '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
        '🚁', '🛸', '✈️', '🛩️', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵',
        '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇',
        '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🎡', '🎢'
      ]
    },
    objects: {
      icon: '💡',
      label: 'Objetos',
      emojis: [
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
        '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️',
        '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️',
        '🧭', '⏰', '⏲️', '⏱️', '⏳', '⌛', '📡', '🔋', '🪫', '🔌',
        '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶'
      ]
    },
    symbols: {
      icon: '❤️',
      label: 'Símbolos',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
        '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
        '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'
      ]
    }
  };

  const filteredEmojis = searchTerm 
    ? Object.values(categories).flatMap(cat => cat.emojis).filter(emoji => 
        emoji.includes(searchTerm)
      )
    : categories[activeCategory as keyof typeof categories]?.emojis || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white">Emoticons</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Search bar */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar emoticons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-full pl-10 pr-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>
      
      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-1 p-4 border-b border-gray-700 overflow-x-auto flex-shrink-0">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-lg transition-colors min-w-[60px] ${
                activeCategory === key 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <span className="text-xl">{category.icon}</span>
              <span className="text-xs">{category.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Emoticons grid */}
      <div className="flex-1 p-4 overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="grid grid-cols-8 gap-2">
          {filteredEmojis.map((emoticon, index) => (
            <button
              key={`${emoticon}-${index}`}
              className="text-2xl hover:bg-gray-700 p-3 rounded-lg transition-all hover:scale-110 transform duration-150 flex items-center justify-center h-12 w-12 active:scale-95"
              onClick={() => onSelect(emoticon)}
            >
              {emoticon}
            </button>
          ))}
        </div>
        
        {filteredEmojis.length === 0 && searchTerm && (
          <div className="text-center text-gray-400 py-8">
            <span className="text-4xl mb-2 block">🔍</span>
            Nenhum emoticon encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default EmoticonSelector;
