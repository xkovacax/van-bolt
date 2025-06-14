import React, { useEffect, ReactNode } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { handleUserSession, setSession } from '../store/slices/authSlice';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log('🚀 AuthProvider: Redux initialization...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', !!session);
      dispatch(setSession(session));
      dispatch(handleUserSession(session));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      dispatch(setSession(session));
      dispatch(handleUserSession(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
};