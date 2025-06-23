
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Index from "./pages/Index";
import ChatTrialPage from "./pages/ChatTrialPage";
import ChatTextAudioPage from "./pages/ChatTextAudioPage";
import PersonalizePage from "./pages/PersonalizePage";
import PlanPage from "./pages/PlanPage";
import SelectedPlanPage from "./pages/SelectedPlanPage";
import FreePlanPage from "./pages/FreePlanPage";
import BasicPlanPage from "./pages/BasicPlanPage";
import PremiumPlanPage from "./pages/PremiumPlanPage";
import UltimatePlanPage from "./pages/UltimatePlanPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <SubscriptionProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/index" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat-trial"
                  element={
                    <ProtectedRoute>
                      <ChatTrialPage />
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
                  path="/personalize"
                  element={
                    <ProtectedRoute>
                      <PersonalizePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plan"
                  element={
                    <ProtectedRoute>
                      <PlanPage />
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
                  path="/free-plan"
                  element={
                    <ProtectedRoute>
                      <FreePlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/basic-plan"
                  element={
                    <ProtectedRoute>
                      <BasicPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/premium-plan"
                  element={
                    <ProtectedRoute>
                      <PremiumPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ultimate-plan"
                  element={
                    <ProtectedRoute>
                      <UltimatePlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SubscriptionProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
