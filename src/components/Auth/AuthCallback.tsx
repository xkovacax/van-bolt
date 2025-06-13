import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const { session, loading, needsProfileSetup, pendingUserData } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    console.log('🔄 AuthCallback state:', { 
      hasSession: !!session, 
      loading, 
      needsProfileSetup, 
      hasPendingData: !!pendingUserData,
      redirecting 
    });
    
    // Wait for auth to finish loading
    if (loading) {
      console.log('⏳ Still loading auth state...');
      return;
    }

    // If we have a session and not already redirecting, redirect to main app
    if (session && !redirecting) {
      console.log('🔄 Redirecting to home page...');
      setRedirecting(true);
      
      // Small delay to ensure state is properly set
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }

    // If no session after loading, something went wrong
    if (!loading && !session) {
      console.log('❌ No session found, redirecting to home');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [session, loading, needsProfileSetup, pendingUserData, redirecting]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">MC</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">
          {loading ? 'Overujeme prihlásenie...' : 'Dokončujeme prihlásenie...'}
        </p>
        <p className="text-gray-500 text-sm mt-2">Čakajte prosím, presmerujeme vás</p>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left max-w-md">
            <div>Session: {session ? '✅' : '❌'}</div>
            <div>Loading: {loading ? '⏳' : '✅'}</div>
            <div>Needs Setup: {needsProfileSetup ? '✅' : '❌'}</div>
            <div>Pending Data: {pendingUserData ? '✅' : '❌'}</div>
            <div>Redirecting: {redirecting ? '✅' : '❌'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;