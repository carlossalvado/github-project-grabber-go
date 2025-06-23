
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useTrialManager } from '@/hooks/useTrialManager';

const TrialTimer = () => {
  const { isTrialActive, trialData, loading } = useTrialManager();
  const [timeDisplay, setTimeDisplay] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!isTrialActive || loading || !trialData) return;

    const updateTimer = () => {
      const now = new Date();
      const trialEnd = new Date(trialData.trial_end);
      const diffMs = trialEnd.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeDisplay('00:00:00');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeDisplay(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      setIsUrgent(hours < 12);
    };

    // Atualizar imediatamente
    updateTimer();
    
    // Atualizar a cada segundo
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [isTrialActive, loading, trialData]);

  // Não renderizar se não for trial ativo ou estiver carregando
  if (!isTrialActive || loading) {
    return null;
  }

  return (
    <div className={`w-full py-3 px-4 text-center text-white font-medium ${
      isUrgent 
        ? 'bg-gradient-to-r from-red-600 to-red-700' 
        : 'bg-gradient-to-r from-orange-600 to-orange-700'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
        <span className="text-sm">
          {isUrgent ? 'URGENTE: ' : ''}Trial expira em: 
        </span>
        <span className="text-lg font-mono font-bold">
          {timeDisplay}
        </span>
        {isUrgent && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
            Faça upgrade agora!
          </span>
        )}
      </div>
    </div>
  );
};

export default TrialTimer;
