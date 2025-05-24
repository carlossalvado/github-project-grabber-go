
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Personalize Sua Experiência
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Conte-nos mais sobre você para criarmos a companhia virtual perfeita
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personality Selection */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-purple-400" />
                Personalidade Ideal
              </CardTitle>
              <CardDescription className="text-gray-300">
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
                        ? 'border-purple-500 bg-purple-900/30 shadow-lg scale-105'
                        : 'border-slate-600/50 hover:border-purple-400/50 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{personality.icon}</div>
                      <h3 className="text-lg font-semibold text-white mb-1">{personality.name}</h3>
                      <p className="text-sm text-gray-400">{personality.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests Selection */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-purple-400" />
                Interesses em Comum
              </CardTitle>
              <CardDescription className="text-gray-300">
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
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border-slate-600'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              {selectedInterests.length > 0 && (
                <div className="mt-4 p-3 bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-300">
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
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 shadow-lg hover:shadow-purple-500/25'
                  : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                Começar Conversa
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
            {(!selectedPersonality || selectedInterests.length < 3) && (
              <p className="text-sm text-gray-400 mt-2">
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
