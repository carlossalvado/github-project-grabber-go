
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth' 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("Protected route:", location.pathname);
    console.log("User authenticated:", !!user);
    console.log("Auth loading:", loading);
  }, [user, loading, location]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Render children if authenticated
  if (user) {
    console.log("User authenticated, rendering content");
    return <>{children}</>;
  }
  
  // User not authenticated
  console.log("User not authenticated, showing login prompt");
  return <Navigate to={redirectTo} />;
};

export default ProtectedRoute;
