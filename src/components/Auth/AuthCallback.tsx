import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const { session } = useAuth();

  useEffect(() => {
    // Handle the OAuth callback
    if (session) {
      // Redirect to home page or dashboard
      window.location.href = '/';
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Dokončujeme prihlásenie...</p>
      </div>
    </div>
  );
};

export default AuthCallback;