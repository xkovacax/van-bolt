import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getRedirectUrl } from '../lib/supabase';
import { User } from '../types';
import { getUserProfile, createUserProfile } from '../services/userService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsProfileSetup: boolean;
  pendingUserData: any;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  loginWithGoogle: () => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: 'owner' | 'customer') => Promise<{ error: AuthError | null }>;
  isAuthenticated: boolean;
  onProfileSetupComplete: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  
  // 🚨 CRITICAL: Single processing flag to prevent all race conditions
  const isProcessing = useRef(false);
  const authInitialized = useRef(false);

  useEffect(() => {
    console.log('🚀 AuthProvider: Single initialization...');
    
    if (authInitialized.current) {
      console.log('⚠️ Already initialized, skipping...');
      return;
    }
    authInitialized.current = true;
    
    // 🎯 SINGLE AUTH LISTENER - handles everything
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      
      // 🚨 PREVENT RACE CONDITIONS
      if (isProcessing.current) {
        console.log('⚠️ Already processing auth change, skipping...');
        return;
      }
      
      await handleAuthStateChange(session);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', !!session);
      handleAuthStateChange(session);
    });

    return () => {
      subscription.unsubscribe();
      authInitialized.current = false;
    };
  }, []);

  // 🎯 SINGLE FUNCTION: Handle all auth state changes
  const handleAuthStateChange = async (session: Session | null) => {
    console.log('🎯 ===== SINGLE AUTH HANDLER =====');
    
    // 🚨 PREVENT RACE CONDITIONS
    if (isProcessing.current) {
      console.log('⚠️ Already processing, skipping...');
      return;
    }
    isProcessing.current = true;

    try {
      // Set session immediately
      setSession(session);

      if (!session?.user) {
        console.log('❌ No session/user, clearing state');
        clearAuthState();
        return;
      }

      console.log('👤 Processing user:', session.user.id);
      
      // 🚨 IMMEDIATE: Clear modal state to prevent flashing
      setNeedsProfileSetup(false);
      setPendingUserData(null);
      setLoading(true);

      // 🎯 SINGLE QUERY: Check if user profile exists
      const { user: userProfile, needsProfileSetup: needsSetup, error } = await getUserProfile(session.user.id);
      
      if (error) {
        console.error('❌ UserService error:', error);
        setLoading(false);
        return;
      }

      if (needsSetup) {
        console.log('🎯 Profile setup needed');
        
        // Prepare pending data for modal
        const pendingData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || 
                  session.user.user_metadata?.picture
        };
        
        // 🎯 ATOMIC STATE UPDATE: Set all modal state at once
        console.log('🎯 ATOMIC: Setting modal state');
        setPendingUserData(pendingData);
        setNeedsProfileSetup(true);
        setUser(null);
        setLoading(false);
        
        console.log('✅ Modal state set - should show modal');
      } else if (userProfile) {
        console.log('✅ User profile loaded:', userProfile.role);
        
        // 🎯 ATOMIC STATE UPDATE: Set user state
        setUser(userProfile);
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        console.log('✅ User state set - no modal needed');
      }
    } catch (error) {
      console.error('❌ Auth handler error:', error);
      setLoading(false);
    } finally {
      // 🚨 ALWAYS reset processing flag
      isProcessing.current = false;
    }
    
    console.log('🎯 ===== AUTH HANDLER COMPLETE =====');
  };

  const clearAuthState = () => {
    console.log('🔄 Clearing auth state');
    setUser(null);
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(false);
    isProcessing.current = false;
  };

  const onProfileSetupComplete = async (newUser: User) => {
    console.log('🎉 Profile setup completed:', newUser);
    
    // 🎯 ATOMIC STATE UPDATE: Complete profile setup
    setUser(newUser);
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(false);
    
    console.log('✅ Profile setup state cleared');
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
    }
    
    return { error };
  };

  const loginWithGoogle = async () => {
    console.log('🔗 Starting Google OAuth login');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    return { error };
  };

  const logout = async () => {
    console.log('👋 Logging out user');
    setLoading(true);
    await supabase.auth.signOut();
    clearAuthState();
  };

  const register = async (name: string, email: string, password: string, role: 'owner' | 'customer') => {
    setLoading(true);
    
    console.log('📝 REGISTER: Creating user with role:', role);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role
        }
      }
    });

    if (error) {
      setLoading(false);
      return { error };
    }

    setLoading(false);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    needsProfileSetup,
    pendingUserData,
    login,
    loginWithGoogle,
    logout,
    register,
    isAuthenticated: !!session,
    onProfileSetupComplete
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};