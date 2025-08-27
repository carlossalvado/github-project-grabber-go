import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (!loading && !user && !hasShownToast) {
      toast.error('Acesso restrito. Você precisa estar logado para acessar esta página.');
      setHasShownToast(true);
    }
  }, [loading, user, hasShownToast]);

  useEffect(() => {
    if (!loading && user && user.email !== 'armempires@gmail.com' && !hasShownToast) {
      toast.error('Acesso negado. Esta página é restrita apenas para administradores.');
      setHasShownToast(true);
    }
  }, [loading, user, hasShownToast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sweetheart-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Verifica se não há usuário logado
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Verifica se o usuário logado é armempires@gmail.com
  if (user.email !== 'armempires@gmail.com') {
    return <Navigate to="/" replace />;
  }

  // Renderiza a página se o usuário for o administrador
  return <>{children}</>;
};

export default AdminProtectedRoute;