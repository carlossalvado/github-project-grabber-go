
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from '@/hooks/useUserCache';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { plan } = useUserCache();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login/landing
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Get current path
  const currentPath = location.pathname;

  // Define allowed paths based on plan
  const getAllowedPaths = () => {
    if (!plan || !plan.plan_active) {
      // No active plan - redirect to profile to choose a plan
      return ['/profile'];
    }

    const planName = plan.plan_name?.toLowerCase();
    console.log('Plan name for path check:', planName);
    
    // Check for trial plan (including variations like "Trial", "trial", etc.)
    if (planName === 'trial' || planName?.includes('trial')) {
      // Trial plan: chat-trial, profile, and checkout pages
      return ['/chat-trial', '/profile', '/basic-plan', '/premium-plan', '/ultimate-plan'];
    } 
    // Check for text & audio plan
    else if (planName?.includes('text') && planName?.includes('audio')) {
      // Text & Audio plan: chat-text-audio and profile
      return ['/chat-text-audio', '/profile'];
    }
    
    // Default: only profile access for unknown plans
    return ['/profile'];
  };

  const allowedPaths = getAllowedPaths();
  const isAllowedPath = allowedPaths.includes(currentPath);

  console.log('Current path:', currentPath);
  console.log('Allowed paths:', allowedPaths);
  console.log('Is allowed path:', isAllowedPath);
  console.log('Plan data:', plan);

  // If current path is not allowed, redirect to appropriate page
  if (!isAllowedPath) {
    if (!plan || !plan.plan_active) {
      return <Navigate to="/profile" replace />;
    }

    const planName = plan.plan_name?.toLowerCase();
    
    // Redirect to correct chat based on plan
    if (planName === 'trial' || planName?.includes('trial')) {
      console.log('Redirecting to trial chat');
      return <Navigate to="/chat-trial" replace />;
    } else if (planName?.includes('text') && planName?.includes('audio')) {
      console.log('Redirecting to text-audio chat');
      return <Navigate to="/chat-text-audio" replace />;
    }
    
    console.log('Redirecting to profile - unknown plan');
    return <Navigate to="/profile" replace />;
  }

  // Render children if authenticated and on allowed path
  return <>{children}</>;
};

export default ProtectedRoute;
