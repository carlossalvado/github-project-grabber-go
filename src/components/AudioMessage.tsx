
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  id: string;
  content: string;
  audioUrl?: string;
  isUser: boolean;
  timestamp: string;
  isPlaying?: boolean;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  agentData?: {
    name: string;
    avatar_url: string;
  };
  userEmail?: string;
}

const AudioMessage: React.FC<AudioMessageProps> = ({
  id,
  content,
  audioUrl,
  isUser,
  timestamp,
  isPlaying = false,
  onPlayAudio,
  agentData,
  userEmail
}) => {
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };

      audioRef.current.onended = () => {
        setCurrentTime(0);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWaveformBars = () => {
    const bars = [];
    const barCount = 40;
    
    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 20 + 5; // Altura aleatória entre 5px e 25px
      const isActive = audioUrl && isPlaying && (currentTime / duration) * barCount > i;
      
      bars.push(
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-200",
            isActive ? "bg-white" : "bg-white/30"
          )}
          style={{ height: `${height}px` }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarImage src={agentData?.avatar_url} alt={agentData?.name} />
          <AvatarFallback className="bg-purple-600 text-white">
            {agentData?.name?.charAt(0) || 'I'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="max-w-[70%] space-y-1">
        <div className={cn(
          'px-4 py-3 rounded-2xl shadow-md',
          isUser 
            ? 'bg-purple-600 text-white rounded-br-none' 
            : 'bg-gray-700 text-white rounded-bl-none'
        )}>
          {/* Audio Player */}
          {audioUrl && (
            <div className="flex items-center gap-3 mb-2">
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
                onClick={() => onPlayAudio(id, audioUrl)}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center gap-0.5 flex-1 h-6">
                  {getWaveformBars()}
                </div>
                
                <div className="text-xs text-white/70 flex items-center gap-1">
                  <span>{formatDuration(currentTime || duration)}</span>
                  <CheckCheck size={12} className="text-green-400" />
                </div>
              </div>
            </div>
          )}
          
          {/* Message content */}
          {content && (
            <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
          )}
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
          <AvatarFallback className="bg-blue-600 text-white">
            {userEmail?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default AudioMessage;
