
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

const PersonalizePage = () => {
  const navigate = useNavigate();
  const [selectedPersonality, setSelectedPersonality] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const personalities = [
    { id: 'romantic', name: 'Romântica', description: 'Carinhosa e apaixonada', icon: '💕' },
    { id: 'playful', name: 'Divertida', description: 'Alegre e brincalhona', icon: '😄' },
    { id: 'mysterious', name: 'Misteriosa', description: 'Intrigante e sedutora', icon: '😏' },
    { id: 'sweet', name: 'Doce', description: 'Meiga e acolhedora', icon: '🥰' },
    { id: 'confident', name: 'Confiante', description: 'Segura e determinada', icon: '😎' },
    { id: 'intellectual', name: 'Intelectual', description: 'Sábia e curiosa', icon: '🤓' }
  ];

  const interests = [
    'Música', 'Cinema', 'Literatura', 'Viagens', 'Culinária', 'Arte',
    'Esportes', 'Tecnologia', 'Natureza', 'Dança', 'Fotografia', 'Jogos'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    if (selectedPersonality && selectedInterests.length > 0) {
      navigate('/modern-chat');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-pink-500 mb-4">
            Personalize Sua Experiência
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Conte-nos mais sobre você para criarmos a companhia virtual perfeita
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personality Selection */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500" />
                Personalidade Ideal
              </CardTitle>
              <CardDescription className="text-slate-400">
                Escolha o tipo de personalidade que mais te atrai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalities.map((personality) => (
                  <div
                    key={personality.id}
                    onClick={() => setSelectedPersonality(personality.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPersonality === personality.id
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-slate-600 hover:border-pink-400/50 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{personality.icon}</div>
                      <h3 className="text-lg font-semibold text-white mb-1">{personality.name}</h3>
                      <p className="text-sm text-slate-400">{personality.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests Selection */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-pink-500" />
                Interesses em Comum
              </CardTitle>
              <CardDescription className="text-slate-400">
                Selecione seus interesses para conversas mais interessantes (mínimo 3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "secondary"}
                    className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 ${
                      selectedInterests.includes(interest)
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              {selectedInterests.length > 0 && (
                <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-pink-500">
                    Selecionados: {selectedInterests.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedPersonality || selectedInterests.length < 3}
              className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
                selectedPersonality && selectedInterests.length >= 3
                  ? 'bg-pink-500 hover:bg-pink-600 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                Começar Conversa
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
            {(!selectedPersonality || selectedInterests.length < 3) && (
              <p className="text-sm text-slate-400 mt-2">
                Complete sua personalização para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizePage;
