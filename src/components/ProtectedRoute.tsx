
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sweetheart-bg">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
