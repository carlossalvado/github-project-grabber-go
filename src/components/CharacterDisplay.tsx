
import React from 'react';
import { cn } from '@/lib/utils';

interface CharacterDisplayProps {
  name?: string;
  nickname?: string;
  avatarUrl?: string;
  className?: string;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ 
  name = "Sweet AI",
  nickname,
  avatarUrl,
  className 
}) => {
  return (
    <div className={cn('h-full rounded-xl overflow-hidden relative flex flex-col', className)}>
      <div className="flex-1 bg-gradient-to-b from-pink-100 to-purple-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs aspect-square rounded-full overflow-hidden border-4 border-white shadow-lg mb-6">
          <img 
            src={avatarUrl || "https://i.imgur.com/nV9pbvg.jpg"} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">{nickname || name}</h2>
          {nickname && <p className="text-gray-600">{name}</p>}
          <div className="mt-4 flex items-center justify-center">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Online
            </span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-500">Relacionamento</div>
            <div className="font-bold text-gray-800">6 dias</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-500">Mensagens</div>
            <div className="font-bold text-gray-800">124</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-500">Presentes</div>
            <div className="font-bold text-gray-800">3</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDisplay;
