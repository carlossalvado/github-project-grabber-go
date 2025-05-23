
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Home, MessageCircle } from 'lucide-react';

const NavBar = () => {
  const { user, signOut } = useAuth();
  const { userSubscription } = useSubscription();
  const location = useLocation();

  // Não exibir a barra de navegação em certas páginas
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
          Isa date
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            >
              <Home size={20} />
            </Button>
          </Link>
          
          {user ? (
            <>
              {userSubscription && (
                <div className="text-xs px-3 py-1 bg-pink-100 text-pink-700 rounded-full">
                  {userSubscription.plan_name || userSubscription.plan?.name}
                </div>
              )}
              
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  Meu Perfil
                </Button>
              </Link>
              
              <Link to="/chat">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                >
                  <MessageCircle size={20} />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm">
                  Cadastro
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
