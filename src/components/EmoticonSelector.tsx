
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
  // Emoticons gratuitos (Telegram/Facebook style)
  const freeEmoticons = [
    '😊', '😂', '🤣', '😭', '😍', '🥰', '😘', '😗', '😙', '😚',
    '🙂', '🤗', '🤔', '🤭', '🤫', '🤐', '😉', '😌', '😔', '😪',
    '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶',
    '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
    '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
    '😰', '😥', '😢', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
    '🥱', '😤', '😡', '🤬', '😠', '🤡', '👻', '💀', '☠️', '👽',
    '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
    '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
    '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
    '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾',
    '🔥', '⭐', '🌟', '✨', '⚡', '💫', '🌈', '☀️', '🌞', '🌝'
  ];
  
  // Emoticons premium (presentes e especiais)
  const premiumEmoticons = [
    '🎁', '💝', '💎', '🏆', '👑', '🌹', '🍰', '🧸', '💐', '🍫', 
    '🥂', '🍾', '💍', '⌚', '👗', '👠', '💄', '💋', '🌺', '🌷',
    '🎂', '🍭', '🍬', '🎈', '🎊', '🎉', '🏅', '🥇', '🎖️', '🏵️'
  ];
  
  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700 max-h-64 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Emoticons</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-10 gap-2 mb-4">
        {freeEmoticons.map(emoticon => (
          <button
            key={emoticon}
            className="text-2xl hover:bg-gray-700 p-2 rounded-md transition-colors hover:scale-110 transform duration-150"
            onClick={() => onSelect(emoticon)}
          >
            {emoticon}
          </button>
        ))}
      </div>
      
      {hasPremiumEmoticons ? (
        <div className="mt-4">
          <div className="text-sm font-medium text-white mb-3 flex items-center">
            <span className="mr-2">Emoticons Premium</span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-1 rounded">Premium</span>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {premiumEmoticons.map(emoticon => (
              <button
                key={emoticon}
                className="text-2xl hover:bg-gray-700 p-2 rounded-md transition-colors hover:scale-110 transform duration-150"
                onClick={() => onSelect(emoticon)}
              >
                {emoticon}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-gray-700 rounded border border-gray-600">
          <p className="text-sm text-gray-300 text-center">
            Desbloqueie emoticons premium com um plano <span className="font-medium text-purple-400">Premium</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default EmoticonSelector;
