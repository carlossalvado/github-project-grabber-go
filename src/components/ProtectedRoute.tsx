import React, { useEffect } from 'react'; // <-- Adicionado useEffect
import { Navigate } from 'react-router-dom'; // <-- Adicionado Navigate
import { toast } from 'sonner'; // <-- Adicionado toast
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Esta parte está ótima, continua igual.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sweetheart-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // --- BLOCO MODIFICADO ---
  // Se não houver usuário, mostramos um toast e redirecionamos.
  if (!user) {
    // Usamos useEffect para disparar a notificação como um efeito colateral.
    useEffect(() => {
      toast.error('Acesso restrito. Você precisa estar logado para acessar esta página.');
    }, []); // Array vazio garante que o toast apareça apenas uma vez.

    // Redireciona para a página inicial, substituindo a rota no histórico.
    return <Navigate to="/" replace />;
  }

  // Renderiza a página protegida se o usuário estiver autenticado.
  return <>{children}</>;
};

export default ProtectedRoute;