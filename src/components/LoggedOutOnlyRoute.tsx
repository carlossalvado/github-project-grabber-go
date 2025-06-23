
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface LoggedOutOnlyRouteProps {
  children: React.ReactNode;
}

const LoggedOutOnlyRoute: React.FC<LoggedOutOnlyRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Se o usuário estiver logado, redirecionar para o profile
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  // Se não estiver logado, mostrar a página
  return <>{children}</>;
};

export default LoggedOutOnlyRoute;
