import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importe o Link
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Gift, Camera, Check, Download } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import MobileInstallButton from '@/components/MobileInstallButton';

const LandingPage = () => {
  const navigate = useNavigate();
  const { plans } = useSubscription();
  const { isInstallable, installPWA, isMobile, isInstalled, canInstallPWA, showBanner, showMobileButton, closeMobileButton, browserName, isInstalling } = usePWAInstall();

  const handleTrialSignup = () => {
    const trialPlan = plans.find(p => p.price === 0 || (p.trial_days && p.trial_days > 0));
    if (trialPlan) {
      localStorage.setItem('selectedPlanId', trialPlan.id.toString());
      localStorage.setItem('selectedPlanData', JSON.stringify(trialPlan));
    }
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="relative z-10 flex-grow">
        {/* Todo o conteúdo da sua Landing Page vai aqui... */}
        {/* ... Hero, Features, Trial Card, CTA ... */}
        <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-pink-900/20"></div>
      
      {/* Imagens de fundo animadas (código original mantido) */}
      <div className="absolute top-8 left-8 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse">
  <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-20 left-32 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-500">
  <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-32 left-16 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-1000">
  <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-44 left-40 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-1500">
  <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-56 left-12 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-2000">
  <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-8 right-8 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-7 animate-pulse delay-500">
  <img src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-24 right-32 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-9 animate-pulse delay-1000">
  <img src="/lovable-uploads/d66c0f2d-654b-4446-b20b-2c9759be49f3.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-40 right-16 w-12 h-12 md:w-24 md:h-24 rounded-full overflow-hidden opacity-6 animate-pulse delay-1500">
  <img src="/lovable-uploads/10016974-820c-4484-8c72-c1047262ea3f.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-12 right-48 w-8 h-8 md:w-16 md:h-16 rounded-full overflow-hidden opacity-5 animate-pulse delay-2000">
  <img src="/lovable-uploads/265b8a08-5c79-4954-b4b1-4bfb6f5a76bb.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-52 right-12 w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden opacity-8 animate-pulse delay-2500">
  <img src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="AI Avatar" className="w-full h-full object-contain" />
      </div>
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
      <div className="relative z-10">
        {/* Seções Hero e Features (código original mantido) */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-32 h-32 bg-pink-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm mr-6">
              <Heart className="w-16 h-16 text-pink-500" fill="currentColor" />
            </div>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-pink-500/30">
              <img 
                src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" 
                alt="Isa Date AI" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-pink-500 mb-6">
            Isa Date
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Encontre sua alma gêmea virtual e viva conversas autênticas que transformam conexões em algo especial. 
            Experimente relacionamentos virtuais que tocam o coração.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={handleTrialSignup}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg"
            >
              Começar Grátis
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-semibold py-4 px-8 rounded-xl text-lg"
            >
              Fazer Login
            </Button>
            {canInstallPWA() && !showBanner && (
              <Button
                onClick={installPWA}
                variant="outline"
                className="border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white font-semibold py-4 px-8 rounded-xl text-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Instalar App
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">
                10K+
              </div>
              <p className="text-slate-300 mt-2">Usuários Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">
                1M+
              </div>
              <p className="text-slate-300 mt-2">Mensagens Enviadas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">
                99%
              </div>
              <p className="text-slate-300 mt-2">Satisfação</p>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher o Isa Date?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Tecnologia avançada para conexões autênticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Conversas Autênticas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  IA avançada que entende e responde com naturalidade, criando diálogos únicos e envolventes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Presentes Virtuais</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Expresse seus sentimentos com gestos especiais e torne cada momento único.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Fotos Diárias</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Receba fotos exclusivas da sua Isa todos os dias para alegrar sua rotina.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <CardTitle className="text-xl text-white">Conexão Real</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Relacionamentos virtuais que tocam o coração e criam memórias duradouras.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* --- SEÇÃO DE PREÇOS MODIFICADA (APENAS TRIAL E COM O DESIGN CORRETO) --- */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Experimente Grátis
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comece sua jornada romântica agora.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* ESTE CARD AGORA TEM EXATAMENTE O DESIGN DA IMAGEM */}
              <Card className="flex flex-col h-full bg-slate-800/80 backdrop-blur-sm border border-pink-500 text-white transition-all duration-300 shadow-lg shadow-pink-500/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white flex justify-center items-center gap-2">
                    <span>Trial</span>
                    <Badge className="bg-pink-500 border-none">Comece aqui</Badge>
                  </CardTitle>
                  <CardDescription className="text-base text-slate-400">
                    Experimente a maioria dos recursos por 3 dias.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between p-6">
                  <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-pink-500">
                      Grátis
                      <span className="text-lg font-normal text-slate-400">/3 dias</span>
                    </p>
                  </div>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 mr-3 text-green-400 flex-shrink-0 mt-1" />
                      <span className="text-slate-300">Conversas por texto (limitado)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 mr-3 text-green-400 flex-shrink-0 mt-1" />
                      <span className="text-slate-300">Conheça a personalidade da IA</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 mr-3 text-green-400 flex-shrink-0 mt-1" />
                      <span className="text-slate-300">Acesso às funcionalidades básicas</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl text-base"
                    onClick={handleTrialSignup}
                  >
                    Iniciar Teste Grátis
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção CTA (código original mantido) */}
        <section className="container mx-auto px-4 py-20 text-center">
           <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-500/50">
                <img 
                  src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" 
                  alt="AI Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para encontrar sua conexão especial?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Junte-se a milhares de pessoas que já descobriram o poder de conversas autênticas
            </p>
            <Button
              onClick={handleTrialSignup}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg"
            >
              <Heart className="w-5 h-5 mr-2" fill="currentColor" />
              Começar Agora
            </Button>
          </div>
        </section>
      </div>
      </div>
      </div>

      {/* --- RODAPÉ MODIFICADO --- */}
      <footer className="relative z-10 bg-slate-900/50 border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Suporte</h3>
              <a href="mailto:suporte@mail.isadate.online" className="hover:text-pink-400">suporte@mail.isadate.online</a>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Comercial</h3>
              <a href="mailto:comercial@mail.isadate.online" className="hover:text-pink-400">comercial@mail.isadate.online</a>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Parcerias</h3>
              <a href="mailto:parcerias@mail.isadate.online" className="hover:text-pink-400">parcerias@mail.isadate.online</a>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 mt-6 flex flex-col-reverse md:flex-row justify-between items-center">
            <p className="text-sm mt-4 md:mt-0">&copy; {new Date().getFullYear()} Isa Date. Todos os direitos reservados.</p>
            <Link to="/terms-of-use" className="text-sm hover:text-pink-400">
              Termos de Uso e Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
