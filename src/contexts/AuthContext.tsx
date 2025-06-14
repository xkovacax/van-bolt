import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  
  // 🚨 CRITICAL: Prevent infinite loops with refs
  const isProcessingUser = useRef(false);
  const lastProcessedUserId = useRef<string | null>(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    
    // 🚨 CRITICAL: Prevent multiple initializations
    if (authInitialized.current) {
      console.log('⚠️ Auth already initialized, skipping...');
      return;
    }
    authInitialized.current = true;
    
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

    return () => {
      subscription.unsubscribe();
      authInitialized.current = false;
    };
  }, []); // 🚨 CRITICAL: Empty dependency array to prevent re-runs

  const resetAuthState = () => {
    console.log('🔄 Resetting auth state');
    setUser(null);
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(false);
    isProcessingUser.current = false;
    lastProcessedUserId.current = null;
  };

  // 🚨 CRITICAL FIX: SINGLE DATABASE QUERY WITH INFINITE LOOP PREVENTION
  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    console.log('👤 ===== STARTING handleUserSession (SINGLE QUERY) =====');
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
      console.log('📊 STEP 1: SINGLE database query (ULTRA-FAST)...');
      const queryStartTime = Date.now();
      
      // 🎯 SINGLE DATABASE QUERY - ULTRA OPTIMIZED
      const { data: userProfile, error: dbError } = await supabase
        .from('users')
        .select('id, name, email, role, avatar, rating, review_count')
        .eq('id', supabaseUser.id)
        .limit(1)
        .single(); // Use single() instead of maybeSingle() for better performance

      const queryTime = Date.now() - queryStartTime;
      console.log(`📊 Database query completed in ${queryTime}ms`);

      // 🚨 STEP 2: HANDLE RESPONSE - NO FALLBACKS, PURE DATABASE DECISION
      if (dbError) {
        console.log('❌ Database error or no profile found:', {
          code: dbError.code,
          message: dbError.message,
          queryTime: `${queryTime}ms`
        });
        
        // Check if it's "no rows" error (user doesn't exist)
        if (dbError.code === 'PGRST116' || dbError.message?.includes('no rows')) {
          console.log('🎯 NO USER PROFILE: Showing profile setup modal');
          
          const pendingData = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || 
                  supabaseUser.user_metadata?.name || 
                  supabaseUser.email?.split('@')[0] || 'User',
            avatar: supabaseUser.user_metadata?.avatar_url || 
                    supabaseUser.user_metadata?.picture
          };
          
          // Set modal state
          setPendingUserData(pendingData);
          setNeedsProfileSetup(true);
          setUser(null);
          setLoading(false);
          
          console.log('🎯 MODAL: Profile setup modal activated', {
            needsSetup: true,
            hasPendingData: true,
            modalShouldShow: true,
            reason: 'no_database_profile'
          });
        } else {
          // Other database error - treat as connection issue
          console.error('🚨 DATABASE CONNECTION ERROR:', dbError);
          setLoading(false);
        }
        
        isProcessingUser.current = false;
        return;
      }

      if (userProfile) {
        // ✅ USER EXISTS IN DATABASE - USE EXACT DATABASE DATA
        console.log('✅ User profile found in database:', userProfile);
        
        const userData = {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role, // 🎯 CRITICAL: Use EXACT role from database
          avatar: userProfile.avatar,
          rating: userProfile.rating,
          reviewCount: userProfile.review_count
        };
        
        console.log('🎯 Setting user with DATABASE role:', userData.role);
        
        // IMMEDIATE state update with DATABASE data
        setUser(userData);
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        console.log('🎯 SUCCESS: User loaded from database', {
          needsSetup: false,
          hasPendingData: false,
          modalShouldShow: false,
          hasUser: true,
          userName: userData.name,
          userRole: userData.role,
          source: 'database_only',
          queryTime: `${queryTime}ms`
        });
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in database query:', error);
      
      // On any error, show profile setup modal
      console.log('🎯 CRITICAL ERROR: Showing profile setup modal');
      const pendingData = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.email?.split('@')[0] || 'User',
        avatar: null
      };
      
      setPendingUserData(pendingData);
      setNeedsProfileSetup(true);
      setUser(null);
      setLoading(false);
    } finally {
      // 🚨 CRITICAL: Always reset processing flag
      isProcessingUser.current = false;
    }
    
    console.log('👤 ===== ENDING handleUserSession (SINGLE QUERY) =====');
  };

  const createUserProfile = async (userData: { name: string; role: 'owner' | 'customer' }) => {
    console.log('🔨 ===== STARTING createUserProfile (SINGLE INSERT) =====');
    
    if (!pendingUserData) {
      console.error('❌ No pending user data for profile creation');
      return { error: 'No pending user data' };
    }

    try {
      console.log('🔨 Creating user profile with data:', userData);
      console.log('🎯 CRITICAL: Role being inserted:', userData.role);
      
      // Generate default avatar
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&size=150&background=059669&color=fff&bold=true`;

      console.log('🔨 Inserting into database...');
      const insertStartTime = Date.now();
      
      // 🎯 CRITICAL: Single insert with EXACT role specified by user
      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: pendingUserData.id,
            name: userData.name.trim(),
            email: pendingUserData.email,
            role: userData.role, // 🎯 CRITICAL: Use EXACT role from form
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
      console.log('🎯 CRITICAL: Database returned role:', newUser.role);

      // 🎯 CRITICAL: Verify the role was saved correctly
      if (newUser.role !== userData.role) {
        console.error('🚨 CRITICAL ERROR: Role mismatch!', {
          expected: userData.role,
          actual: newUser.role
        });
      } else {
        console.log('✅ Role saved correctly in database:', newUser.role);
      }

      // 🎯 CRITICAL: Set user state with EXACT database data
      console.log('🔨 Setting user state with EXACT database data...');
      const userFromDb = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role, // 🎯 CRITICAL: Use EXACT role from database
        avatar: newUser.avatar,
        rating: newUser.rating,
        reviewCount: newUser.review_count
      };
      
      console.log('🎯 FINAL: Setting user with role:', userFromDb.role);
      setUser(userFromDb);

      // Clear pending setup
      console.log('🔨 Clearing pending setup state...');
      setNeedsProfileSetup(false);
      setPendingUserData(null);

      // Update processing flags
      lastProcessedUserId.current = newUser.id;

      console.log('🎯 SUCCESS: Profile created successfully', {
        needsSetup: false,
        hasPendingData: false,
        modalShouldShow: false,
        hasUser: true,
        userName: userFromDb.name,
        userRole: userFromDb.role,
        source: 'database_insert'
      });

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

    // If user is created, create user profile immediately
    if (data.user) {
      try {
        console.log('📝 REGISTER: Creating database profile with role:', role);
        
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name: name || 'User',
              email: email || '',
              role, // 🎯 CRITICAL: Use exact role from registration
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&size=150&background=059669&color=fff&bold=true`,
              rating: 5.0,
              review_count: 0
            }
          ]);

        if (userError) {
          console.error('❌ Error creating user profile during registration:', userError);
        } else {
          console.log('✅ User profile created during registration with role:', role);
        }
      } catch (error) {
        console.error('❌ Profile creation error during registration:', error);
      }
    }

    setLoading(false);
    return { error };
  };

  const completePendingSetup = () => {
    console.log('❌ Cancelling profile setup');
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    isProcessingUser.current = false;
    lastProcessedUserId.current = null;
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
    completePendingSetup,
    createUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};