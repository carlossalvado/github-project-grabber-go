
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, ArrowRight, Sparkles, MessageCircle, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PersonalizePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPersonality, setSelectedPersonality] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Recuperar dados do usuário e plano do cache
    const cachedUserData = localStorage.getItem('userData');
    if (cachedUserData) {
      try {
        const data = JSON.parse(cachedUserData);
        setUserData(data);
      } catch (error) {
        console.error('Erro ao recuperar dados do usuário:', error);
      }
    }
  }, []);

  const personalities = [
    {
      id: 'romantic',
      name: 'Romântica',
      description: 'Carinhosa, sensível e apaixonada'
    },
    {
      id: 'playful',
      name: 'Divertida',
      description: 'Brincalhona, espontânea e alegre'
    },
    {
      id: 'intelligent',
      name: 'Intelectual',
      description: 'Curiosa, profunda e inteligente'
    },
    {
      id: 'adventurous',
      name: 'Aventureira',
      description: 'Corajosa, exploradora e ousada'
    }
  ];

  const interests = [
    'Música', 'Filmes', 'Livros', 'Viagens', 'Culinária', 
    'Arte', 'Esportes', 'Tecnologia', 'Natureza', 'Fotografia'
  ];

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    // Salvar personalização no cache
    const personalizationData = {
      personality: selectedPersonality,
      interests: selectedInterests,
      personalizationCompleted: true
    };
    
    // Atualizar dados do usuário no cache
    const updatedUserData = {
      ...userData,
      ...personalizationData
    };
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    
    // Recuperar o plano selecionado e redirecionar para o card único
    const selectedPlanId = localStorage.getItem('selectedPlanId');
    if (selectedPlanId) {
      navigate(`/plan/${selectedPlanId}`);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Quadrante Superior Esquerdo */}
      <div className="absolute top-8 left-8 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-20 left-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-32 left-16 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1000">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-44 left-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-1500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-56 left-12 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-2000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Superior Direito */}
      <div className="absolute top-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-500">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-24 right-32 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-1000">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-40 right-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-12 right-48 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-2000">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-52 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Inferior Esquerdo */}
      <div className="absolute bottom-8 left-8 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-1000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-20 left-32 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-32 left-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-7 animate-pulse delay-2000">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-44 left-40 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-5 animate-pulse delay-2500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-56 left-12 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-9 animate-pulse delay-3000">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      {/* Quadrante Inferior Direito */}
      <div className="absolute bottom-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1500">
        <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-20 right-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-2000">
        <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-36 right-16 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-2500">
        <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-52 right-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-7 animate-pulse delay-3000">
        <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-64 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-3500">
        <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full overflow-hidden opacity-40">
              <img 
                src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
                alt="AI Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Personalize sua Experiência
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Ajude-nos a criar a companheira virtual perfeita para você
          </p>
          {userData?.selectedPlan && (
            <div className="mt-4 inline-block px-4 py-2 bg-pink-500/20 rounded-full border border-pink-500/30">
              <span className="text-pink-300 font-medium">
                Plano selecionado: {userData.selectedPlan.name}
              </span>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Personality Selection */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                Escolha a Personalidade
              </CardTitle>
              <CardDescription className="text-slate-300">
                Selecione o tipo de personalidade que mais te atrai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalities.map((personality) => (
                  <Card
                    key={personality.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedPersonality === personality.id
                        ? 'bg-pink-500/20 border-pink-500/50 shadow-lg'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50'
                    }`}
                    onClick={() => setSelectedPersonality(personality.id)}
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {personality.name}
                      </h3>
                      <p className="text-slate-300 text-sm">
                        {personality.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests Selection */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-500" />
                </div>
                Seus Interesses
              </CardTitle>
              <CardDescription className="text-slate-300">
                Selecione os tópicos que você gosta de conversar (máximo 5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {interests.map((interest) => (
                  <Button
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInterestToggle(interest)}
                    disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 5}
                    className={`${
                      selectedInterests.includes(interest)
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'border-slate-500 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {interest}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-slate-400 mt-4">
                {selectedInterests.length}/5 interesses selecionados
              </p>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedPersonality || selectedInterests.length === 0}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-4 text-lg rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Continuar para o Plano
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizePage;
