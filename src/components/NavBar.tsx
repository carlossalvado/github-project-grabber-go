
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const NavBar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-xl font-bold text-gray-900">
            ChatAI
          </Link>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Link to="/chat" className="text-gray-600 hover:text-gray-900">
                Chat Básico
              </Link>
              <Link to="/chat-text-audio" className="text-gray-600 hover:text-gray-900">
                Chat com Áudio
              </Link>
              <Link to="/gemini-chat" className="text-gray-600 hover:text-gray-900">
                Gemini Chat
              </Link>
              <Link to="/gemini-live-chat" className="text-purple-600 hover:text-purple-900 font-medium">
                Gemini Live
              </Link>
              <Link to="/chat-premium" className="text-purple-600 hover:text-purple-900">
                Premium
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">
                  Cadastrar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
