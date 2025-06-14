import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedTrialRoute from "./components/ProtectedTrialRoute";
import NavBar from "./components/NavBar";

// Páginas
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import PersonalizePage from "./pages/PersonalizePage";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import ModernChatPage from "./pages/ModernChatPage";
import ChatTextOnlyPage from "./pages/ChatTextOnlyPage";
import ChatTextAudioPage from "./pages/ChatTextAudioPage";
import ChatPremiumPage from "./pages/ChatPremiumPage";
import ChatTrialPage from "./pages/ChatTrialPage";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import PlanPage from "./pages/PlanPage";
import FreePlanPage from "./pages/FreePlanPage";
import BasicPlanPage from "./pages/BasicPlanPage";
import PremiumPlanPage from "./pages/PremiumPlanPage";
import UltimatePlanPage from "./pages/UltimatePlanPage";
import SelectedPlanPage from "./pages/SelectedPlanPage";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <NavBar />
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/home" element={<Home />} />
              
              {/* Páginas específicas para cada plano */}
              <Route path="/plan/:planId" element={<PlanPage />} />
              <Route path="/plan/free" element={<FreePlanPage />} />
              <Route path="/plan/basic" element={<BasicPlanPage />} />
              <Route path="/plan/premium" element={<PremiumPlanPage />} />
              <Route path="/plan/ultimate" element={<UltimatePlanPage />} />
              
              {/* Página de personalização */}
              <Route 
                path="/personalize" 
                element={
                  <ProtectedRoute>
                    <PersonalizePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirecionamento da antiga página de planos para a home */}
              <Route path="/plans" element={<Navigate to="/" />} />
              
              {/* Rotas protegidas */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/selected-plan" 
                element={
                  <ProtectedRoute>
                    <SelectedPlanPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/modern-chat" 
                element={
                  <ProtectedRoute>
                    <ModernChatPage />
                  </ProtectedRoute>
                } 
              />

              {/* Páginas de chat específicas por plano com nomes atualizados */}
              <Route 
                path="/chat-text-only" 
                element={
                  <ProtectedRoute>
                    <ChatTextOnlyPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat-text-audio" 
                element={
                  <ProtectedRoute>
                    <ChatTextAudioPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat-premium" 
                element={
                  <ProtectedRoute>
                    <ChatPremiumPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rota protegida especificamente para trial */}
              <Route 
                path="/chat-trial" 
                element={
                  <ProtectedTrialRoute>
                    <ChatTrialPage />
                  </ProtectedTrialRoute>
                } 
              />
              
              {/* Rota de catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
