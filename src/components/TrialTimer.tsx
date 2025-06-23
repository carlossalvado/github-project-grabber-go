
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useTrialManager } from '@/hooks/useTrialManager';

const TrialTimer = () => {
  const { isTrialActive, hoursRemaining, loading } = useTrialManager();
  const [timeDisplay, setTimeDisplay] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!isTrialActive || loading) return;

    const updateTimeDisplay = () => {
      const hours = Math.floor(hoursRemaining);
      const totalMinutes = (hoursRemaining - hours) * 60;
      const minutes = Math.floor(totalMinutes);
      
      setTimeDisplay(`${hours}h ${minutes}m`);
      setIsUrgent(hoursRemaining <= 12);
    };

    updateTimeDisplay();
    
    // Atualizar a cada minuto
    const interval = setInterval(updateTimeDisplay, 60000);
    
    return () => clearInterval(interval);
  }, [hoursRemaining, isTrialActive, loading]);

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
          {isUrgent ? 'URGENTE: ' : ''}Trial expira em: {timeDisplay}
        </span>
        {isUrgent && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            Faça upgrade agora!
          </span>
        )}
      </div>
    </div>
  );
};

export default TrialTimer;
