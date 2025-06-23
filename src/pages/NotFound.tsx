
import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // If user is logged in, redirect to profile
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-4">
        <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <Heart className="w-8 h-8 text-white" fill="currentColor" />
        </div>
        <h1 className="text-4xl font-bold text-pink-500 mb-4">404</h1>
        <p className="text-xl text-slate-300 mb-6">Oops! Página não encontrada</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
