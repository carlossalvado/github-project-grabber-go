
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { selectPlan, plans } = useSubscription();

  const textAudioPlan = plans.find(plan => plan.name === 'Text & Audio');

  const handleUpgrade = async () => {
    if (textAudioPlan) {
      await selectPlan(textAudioPlan.id);
      onClose();
    }
  };

  const handleGoToPlans = () => {
    navigate('/');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl text-white">Trial Expirado</DialogTitle>
          <DialogDescription className="text-slate-300">
            Seu trial de 72 horas expirou. Continue aproveitando todas as funcionalidades!
          </DialogDescription>
        </DialogHeader>

        {textAudioPlan && (
          <Card className="bg-slate-700 border-pink-500/50 border-2">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2">
                <Badge className="bg-pink-500 text-white px-3 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  Recomendado
                </Badge>
              </div>
              <CardTitle className="text-xl text-white">{textAudioPlan.name}</CardTitle>
              <CardDescription className="text-slate-300">{textAudioPlan.description}</CardDescription>
              <div className="text-3xl font-bold text-pink-500">
                US${(textAudioPlan.price / 100).toFixed(2)}
                <span className="text-sm font-normal text-white">/mês</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-2">
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm">Mensagens de Texto (Ilimitado)</span>
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm">Mensagens de Áudio - (10 Mensagens)</span>
                </li>
                <li className="flex items-center text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm">Ligações de Voz - (2 Ligações)</span>
                </li>
              </ul>
              
              <div className="space-y-2">
                <Button
                  onClick={handleUpgrade}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3"
                >
                  Continuar com Text & Audio
                </Button>
                
                <Button
                  onClick={handleGoToPlans}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Ver Todos os Planos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredModal;
