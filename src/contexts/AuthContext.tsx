import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getRedirectUrl } from '../lib/supabase';
import { User } from '../types';
import { getUserProfile, hasAccessToken, getCurrentUserId, getUserMetadata } from '../services/userService';

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
  
  // 🚨 CRITICAL: Prevent infinite loops with refs
  const isProcessingUser = useRef(false);
  const lastProcessedUserId = useRef<string | null>(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    console.log('🚀 AuthProvider initializing with userService...');
    
    // 🚨 CRITICAL: Prevent multiple initializations
    if (authInitialized.current) {
      console.log('⚠️ Auth already initialized, skipping...');
      return;
    }
    authInitialized.current = true;
    
    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        resetAuthState();
      }
    });

    return () => {
      subscription.unsubscribe();
      authInitialized.current = false;
    };
  }, []); // 🚨 CRITICAL: Empty dependency array

  const initializeAuth = async () => {
    try {
      console.log('🔍 Checking access token...');
      
      // 🎯 STEP 1: Synchronously check if access token exists
      const hasToken = await hasAccessToken();
      
      if (!hasToken) {
        console.log('❌ No access token found');
        setLoading(false);
        return;
      }

      console.log('✅ Access token found, getting user ID...');
      
      // 🎯 STEP 2: Get current user ID
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.log('❌ No user ID found');
        setLoading(false);
        return;
      }

      console.log('🔍 User ID found:', userId);
      
      // 🎯 STEP 3: Use userService to get user profile
      const { user: userProfile, needsProfileSetup: needsSetup, error } = await getUserProfile(userId);
      
      if (error) {
        console.error('❌ UserService error:', error);
        setLoading(false);
        return;
      }

      if (needsSetup) {
        console.log('🎯 Profile setup needed, getting user metadata...');
        
        // Get user metadata for profile setup
        const metadata = await getUserMetadata();
        if (metadata) {
          setPendingUserData(metadata);
          setNeedsProfileSetup(true);
        }
        setLoading(false);
      } else if (userProfile) {
        console.log('✅ User profile loaded:', userProfile);
        setUser(userProfile);
        setLoading(false);
      }

      // Get session for context
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setLoading(false);
    }
  };

  const resetAuthState = () => {
    console.log('🔄 Resetting auth state');
    setUser(null);
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(false);
    isProcessingUser.current = false;
    lastProcessedUserId.current = null;
  };

  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    console.log('👤 ===== STARTING handleUserSession with userService =====');
    console.log('👤 User ID:', supabaseUser.id);
    
    // 🚨 CRITICAL: Prevent infinite loops
    if (isProcessingUser.current) {
      console.log('⚠️ Already processing user, skipping...');
      return;
    }
    
    if (lastProcessedUserId.current === supabaseUser.id) {
      console.log('⚠️ Same user already processed, skipping...');
      return;
    }
    
    // Set processing flags
    isProcessingUser.current = true;
    lastProcessedUserId.current = supabaseUser.id;
    
    // 🚨 IMMEDIATE STATE RESET TO PREVENT MODAL FLASH
    console.log('⚡ IMMEDIATE: Preventing modal flash');
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(true);
    
    try {
      // 🎯 USE USERSERVICE: Single query approach
      const { user: userProfile, needsProfileSetup: needsSetup, error } = await getUserProfile(supabaseUser.id);
      
      if (error) {
        console.error('❌ UserService error in handleUserSession:', error);
        setLoading(false);
        isProcessingUser.current = false;
        return;
      }

      if (needsSetup) {
        console.log('🎯 Profile setup needed from handleUserSession');
        
        const pendingData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email?.split('@')[0] || 'User',
          avatar: supabaseUser.user_metadata?.avatar_url || 
                  supabaseUser.user_metadata?.picture
        };
        
        setPendingUserData(pendingData);
        setNeedsProfileSetup(true);
        setUser(null);
        setLoading(false);
        
        console.log('🎯 MODAL: Profile setup modal activated');
      } else if (userProfile) {
        console.log('✅ User profile loaded from userService:', userProfile);
        
        setUser(userProfile);
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        console.log('🎯 SUCCESS: User loaded with role:', userProfile.role);
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleUserSession:', error);
      setLoading(false);
    } finally {
      // 🚨 CRITICAL: Always reset processing flag
      isProcessingUser.current = false;
    }
    
    console.log('👤 ===== ENDING handleUserSession =====');
  };

  const onProfileSetupComplete = (newUser: User) => {
    console.log('🎉 Profile setup completed:', newUser);
    
    // Update state with new user
    setUser(newUser);
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    
    // Update processing flags
    lastProcessedUserId.current = newUser.id;
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
    resetAuthState();
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

    // Note: Profile creation will be handled by the profile setup modal
    // after redirect, not here
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