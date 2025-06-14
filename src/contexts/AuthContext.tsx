import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getRedirectUrl } from '../lib/supabase';
import { User } from '../types';

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
  completePendingSetup: () => void;
  createUserProfile: (userData: { name: string; role: 'owner' | 'customer' }) => Promise<{ error: any }>;
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

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔄 Initial session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        error: error?.message 
      });
      
      if (error) {
        console.error('❌ Session error:', error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        console.log('✅ No session found, setting loading to false');
        setLoading(false);
      }
    }).catch((error) => {
      console.error('❌ Session check failed:', error);
      setLoading(false);
    });

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

    return () => subscription.unsubscribe();
  }, []);

  const resetAuthState = () => {
    console.log('🔄 Resetting auth state');
    setUser(null);
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(false);
  };

  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    console.log('👤 ===== STARTING handleUserSession =====');
    console.log('👤 User ID:', supabaseUser.id);
    console.log('👤 User email:', supabaseUser.email);
    
    // CRITICAL: Reset modal state immediately to prevent flashing
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    
    try {
      console.log('📊 STEP 1: Quick user profile check...');
      
      const queryStartTime = Date.now();
      
      // Simple query without timeout
      const { data: userProfile, error: dbError } = await supabase
        .from('users')
        .select('id, name, email, role, avatar, rating, review_count')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      const queryTime = Date.now() - queryStartTime;
      console.log(`📊 Query completed in ${queryTime}ms`);

      // STEP 2: Handle database response
      if (dbError) {
        console.log('❌ Database error:', {
          code: dbError.code,
          message: dbError.message,
          queryTime: `${queryTime}ms`
        });
        
        // Only setup profile if it's a real "not found" error
        if (dbError.code === 'PGRST116' || dbError.message?.includes('not found')) {
          console.log('🎯 User not found - setting up profile creation');
          setupPendingProfile(supabaseUser);
        } else {
          console.log('⚠️ Database error but not "not found" - assuming user exists');
          // Fallback: create basic user object
          setUser({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || 'User',
            email: supabaseUser.email || '',
            role: 'customer',
            avatar: supabaseUser.user_metadata?.avatar_url
          });
          setLoading(false);
        }
        return;
      }

      // STEP 3: Check if user profile exists
      if (userProfile) {
        console.log(`✅ User profile found in ${queryTime}ms`);
        
        // CRITICAL: Set user immediately and ensure modal state is cleared
        setUser({
          id: userProfile.id,
          name: userProfile.name || 'User',
          email: userProfile.email || '',
          role: userProfile.role,
          avatar: userProfile.avatar,
          rating: userProfile.rating,
          reviewCount: userProfile.review_count
        });
        
        // Ensure modal state is completely cleared
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        console.log('✅ User state updated successfully - modal should NOT show');
      } else {
        // No profile found - need profile setup
        console.log(`🎯 No profile found in ${queryTime}ms - triggering setup modal`);
        setupPendingProfile(supabaseUser);
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleUserSession:', error);
      
      // If there's a critical error, assume user exists to prevent modal flashing
      console.log('🎯 CRITICAL ERROR FALLBACK: Assuming user exists to prevent modal flash');
      setUser({
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || 'User',
        email: supabaseUser.email || '',
        role: 'customer',
        avatar: supabaseUser.user_metadata?.avatar_url
      });
      setNeedsProfileSetup(false);
      setPendingUserData(null);
      setLoading(false);
    }
    
    console.log('👤 ===== ENDING handleUserSession =====');
  };

  // Helper function to setup pending profile
  const setupPendingProfile = (supabaseUser: SupabaseUser) => {
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || 
            supabaseUser.email?.split('@')[0] || 'User',
      avatar: supabaseUser.user_metadata?.avatar_url || 
              supabaseUser.user_metadata?.picture
    };
    
    console.log('📝 Setting up pending profile:', userData);
    
    // CRITICAL: Only set these if we're sure the user needs setup
    setPendingUserData(userData);
    setNeedsProfileSetup(true);
    setUser(null);
    setLoading(false);
    
    console.log('🎯 Profile setup modal should now show');
  };

  const createUserProfile = async (userData: { name: string; role: 'owner' | 'customer' }) => {
    console.log('🔨 ===== STARTING createUserProfile =====');
    
    if (!pendingUserData) {
      console.error('❌ No pending user data for profile creation');
      return { error: 'No pending user data' };
    }

    try {
      console.log('🔨 Creating user profile with data:', userData);
      
      // Generate default avatar if none provided
      let avatarUrl = pendingUserData.avatar;
      if (!avatarUrl) {
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&size=150&background=059669&color=fff&bold=true`;
      }

      console.log('🔨 Inserting into database...');
      const insertStartTime = Date.now();
      
      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: pendingUserData.id,
            name: userData.name.trim(),
            email: pendingUserData.email,
            role: userData.role,
            avatar: avatarUrl,
            rating: 5.0,
            review_count: 0
          }
        ])
        .select('id, name, email, role, avatar, rating, review_count')
        .single();

      const insertTime = Date.now() - insertStartTime;
      console.log(`🔨 Insert completed in ${insertTime}ms`);

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        return { error: dbError };
      }

      console.log('✅ User profile created successfully:', newUser);

      // Update auth metadata in background (don't wait for it)
      supabase.auth.updateUser({
        data: {
          full_name: userData.name.trim(),
          role: userData.role
        }
      }).then(({ error }) => {
        if (error) {
          console.error('⚠️ Auth metadata update error:', error);
        } else {
          console.log('✅ Auth metadata updated');
        }
      });

      // Set the user in state immediately
      console.log('🔨 Setting user state...');
      setUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        rating: newUser.rating,
        reviewCount: newUser.review_count
      });

      // Clear pending setup - CRITICAL for preventing modal flash
      console.log('🔨 Clearing pending setup state...');
      setNeedsProfileSetup(false);
      setPendingUserData(null);

      console.log('🎉 Profile setup completed successfully');
      console.log('🔨 ===== ENDING createUserProfile =====');
      return { error: null };
    } catch (error) {
      console.error('❌ Profile creation error:', error);
      console.log('🔨 ===== ENDING createUserProfile (ERROR) =====');
      return { error };
    }
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

    // If user is created, create user profile
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            name: name || 'User',
            email: email || '',
            role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&size=150&background=059669&color=fff&bold=true`,
            rating: 5.0,
            review_count: 0
          }
        ]);

      if (userError) {
        console.error('Error creating user profile:', userError);
      }
    }

    setLoading(false);
    return { error };
  };

  const completePendingSetup = () => {
    console.log('❌ Cancelling profile setup');
    setNeedsProfileSetup(false);
    setPendingUserData(null);
  };

  // Enhanced debug logging with modal state tracking
  useEffect(() => {
    const shouldShowModal = needsProfileSetup && pendingUserData && !loading;
    console.log('🔍 AUTH STATE:', {
      hasUser: !!user,
      userName: user?.name,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      loading,
      needsProfileSetup,
      hasPendingData: !!pendingUserData,
      modalShouldShow: shouldShowModal,
      timestamp: new Date().toISOString()
    });
  }, [user, session, loading, needsProfileSetup, pendingUserData]);

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
    completePendingSetup,
    createUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};