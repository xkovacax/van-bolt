import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const { session, loading, needsProfileSetup } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    console.log('AuthCallback - session:', session, 'loading:', loading, 'needsProfileSetup:', needsProfileSetup);
    
    // Wait for auth to finish loading
    if (loading) return;

    // If we have a session but need profile setup, redirect to main app
    // The UserProfileSetup modal will handle the setup
    if (session && !redirecting) {
      console.log('Redirecting to home page');
      setRedirecting(true);
      window.location.href = '/';
    }
  }, [session, loading, needsProfileSetup, redirecting]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">MC</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Dokončujeme prihlásenie...</p>
        <p className="text-gray-500 text-sm mt-2">Čakajte prosím, presmerujeme vás</p>
      </div>
    </div>
  );
};

export default AuthCallback;