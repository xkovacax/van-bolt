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

// Helper function to get preferred role from localStorage with expiry check
const getPreferredRole = (): 'owner' | 'customer' | null => {
  try {
    const storedData = localStorage.getItem('preferredRole');
    if (!storedData) {
      return null;
    }

    const { role, expiry } = JSON.parse(storedData);
    
    // Check if the stored preference has expired (10 minutes)
    if (Date.now() > expiry) {
      console.log('🕒 Preferred role expired, removing from localStorage');
      localStorage.removeItem('preferredRole');
      return null;
    }

    console.log('🎯 Found valid preferred role from localStorage:', { 
      role, 
      expiresIn: Math.round((expiry - Date.now()) / 1000 / 60) + ' minutes' 
    });
    return role;
  } catch (error) {
    console.error('❌ Error reading preferred role from localStorage:', error);
    localStorage.removeItem('preferredRole'); // Clean up corrupted data
    return null;
  }
};

// Helper function to set profile creation flag
const setProfileJustCreated = () => {
  const expiryTime = Date.now() + (2 * 60 * 1000); // 2 minutes from now
  const flagData = {
    created: true,
    expiry: expiryTime
  };
  localStorage.setItem('profileJustCreated', JSON.stringify(flagData));
  console.log('🔒 Set profile creation flag with 2-minute expiry:', new Date(expiryTime));
};

// Helper function to clean up expired flags
const cleanupExpiredFlags = () => {
  try {
    // Clean up preferred role
    const preferredRoleData = localStorage.getItem('preferredRole');
    if (preferredRoleData) {
      const { expiry } = JSON.parse(preferredRoleData);
      if (Date.now() > expiry) {
        console.log('🧹 Cleaning up expired preferred role');
        localStorage.removeItem('preferredRole');
      }
    }

    // Clean up profile creation flag
    const profileCreatedData = localStorage.getItem('profileJustCreated');
    if (profileCreatedData) {
      const { expiry } = JSON.parse(profileCreatedData);
      if (Date.now() > expiry) {
        console.log('🧹 Cleaning up expired profile creation flag');
        localStorage.removeItem('profileJustCreated');
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired flags:', error);
    localStorage.removeItem('preferredRole');
    localStorage.removeItem('profileJustCreated');
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    
    // Clean up any expired flags on startup
    cleanupExpiredFlags();
    
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

  // 🚨 CRITICAL FIX: SINGLE REQUEST FUNCTION - NO MODAL FLASHING
  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    console.log('👤 ===== STARTING handleUserSession (SINGLE REQUEST) =====');
    console.log('👤 User ID:', supabaseUser.id);
    
    // 🚨 STEP 1: IMMEDIATE STATE RESET TO PREVENT MODAL FLASH
    console.log('⚡ IMMEDIATE: Preventing modal flash');
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(true); // Keep loading until we know for sure
    
    try {
      console.log('📊 STEP 2: SINGLE database query with 1.5s timeout...');
      const queryStartTime = Date.now();
      
      // 🎯 SINGLE OPTIMIZED QUERY - NO MULTIPLE REQUESTS
      const singleQueryPromise = supabase
        .from('users')
        .select('id, name, email, role, avatar, rating, review_count')
        .eq('id', supabaseUser.id)
        .limit(1)
        .maybeSingle();

      // AGGRESSIVE 1.5 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Single query timeout (1.5s)'));
        }, 1500);
      });

      const { data: userProfile, error: dbError } = await Promise.race([
        singleQueryPromise,
        timeoutPromise
      ]) as any;

      const queryTime = Date.now() - queryStartTime;
      console.log(`📊 Single query completed in ${queryTime}ms`);

      // 🚨 STEP 3: IMMEDIATE DECISION - NO DELAYS
      if (dbError) {
        console.error('❌ Database error:', dbError);
        // On error, create fallback user immediately - NO MODAL
        createFallbackUser(supabaseUser);
        return;
      }

      if (userProfile) {
        // ✅ USER EXISTS - SET IMMEDIATELY, NO MODAL
        console.log('✅ User profile found - setting immediately');
        
        const userData = {
          id: userProfile.id,
          name: userProfile.name || 'User',
          email: userProfile.email || '',
          role: userProfile.role,
          avatar: userProfile.avatar,
          rating: userProfile.rating,
          reviewCount: userProfile.review_count
        };
        
        // IMMEDIATE state update
        setUser(userData);
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        // Clean up any stored preferences
        localStorage.removeItem('preferredRole');
        
        console.log('🎯 MODAL CHECK: User exists, NO MODAL', {
          needsSetup: false,
          hasPendingData: false,
          modalShouldShow: false,
          hasUser: true,
          userName: userData.name,
          userRole: userData.role,
          reason: 'user_exists_immediate',
          queryTime: `${queryTime}ms`
        });
      } else {
        // ❌ NO USER PROFILE - SHOW MODAL
        console.log('❌ No user profile found - setup needed');
        
        // Get preferred role for modal
        const preferredRole = getPreferredRole();
        
        const pendingData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email?.split('@')[0] || 'User',
          avatar: supabaseUser.user_metadata?.avatar_url || 
                  supabaseUser.user_metadata?.picture,
          preferredRole: preferredRole as 'owner' | 'customer' || undefined
        };
        
        // Set modal state
        setPendingUserData(pendingData);
        setNeedsProfileSetup(true);
        setUser(null);
        setLoading(false);
        
        console.log('🎯 MODAL CHECK: No profile, SHOW MODAL', {
          needsSetup: true,
          hasPendingData: true,
          modalShouldShow: true,
          reason: 'no_profile_found',
          queryTime: `${queryTime}ms`,
          preferredRole
        });
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in single query:', error);
      
      // On any error, create fallback user - NO MODAL
      createFallbackUser(supabaseUser);
    }
    
    console.log('👤 ===== ENDING handleUserSession (SINGLE REQUEST) =====');
  };

  // Helper function to create fallback user (prevents modal flash on errors)
  const createFallbackUser = (supabaseUser: SupabaseUser) => {
    console.log('🔧 Creating fallback user to prevent modal flash');
    setUser({
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || 
            supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      role: 'customer',
      avatar: supabaseUser.user_metadata?.avatar_url || 
              supabaseUser.user_metadata?.picture
    });
    setNeedsProfileSetup(false);
    setPendingUserData(null);
    setLoading(false);
    
    console.log('🎯 MODAL CHECK: Fallback user created, NO MODAL', {
      needsSetup: false,
      hasPendingData: false,
      modalShouldShow: false,
      reason: 'fallback_user_created'
    });
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

      console.log('🔨 Inserting into database with 2 second timeout...');
      const insertStartTime = Date.now();
      
      // FAST INSERT with timeout
      const insertPromise = supabase
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

      // 2 second timeout for insert
      const insertTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('⏰ INSERT TIMEOUT: Profile creation timeout after 2 seconds');
          reject(new Error('Profile creation timeout (2s)'));
        }, 2000);
      });

      const { data: newUser, error: dbError } = await Promise.race([
        insertPromise,
        insertTimeoutPromise
      ]) as any;

      const insertTime = Date.now() - insertStartTime;
      console.log(`🔨 Insert completed in ${insertTime}ms`);

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        return { error: dbError };
      }

      console.log('✅ User profile created successfully:', newUser);

      // CRITICAL: Set localStorage flag to prevent modal re-showing after redirect
      console.log('🔒 Setting localStorage flag to prevent modal re-showing');
      setProfileJustCreated();

      // CRITICAL: Clean up preferred role ONLY after successful profile creation
      console.log('🧹 Profile created successfully - cleaning up preferred role from localStorage');
      localStorage.removeItem('preferredRole');

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

      // CRITICAL FIX: Set the user state with the ACTUAL data from database
      console.log('🔨 Setting user state with database data...');
      const userFromDb = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role, // This ensures the correct role is displayed
        avatar: newUser.avatar,
        rating: newUser.rating,
        reviewCount: newUser.review_count
      };
      
      console.log('🎯 Setting user with role:', userFromDb.role);
      setUser(userFromDb);

      // Clear pending setup - CRITICAL for preventing modal flash
      console.log('🔨 Clearing pending setup state...');
      setNeedsProfileSetup(false);
      setPendingUserData(null);

      console.log('🎯 MODAL CHECK: Profile created successfully', {
        needsSetup: false,
        hasPendingData: false,
        modalShouldShow: false,
        hasUser: true,
        userName: userFromDb.name,
        userRole: userFromDb.role,
        localStorageFlag: true,
        reason: 'profile_created',
        timestamp: new Date().toISOString()
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
    
    // Clean up any stored flags on logout
    localStorage.removeItem('preferredRole');
    localStorage.removeItem('profileJustCreated');
    
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

    // If user is created, create user profile with timeout
    if (data.user) {
      try {
        const profilePromise = supabase
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

        const profileTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile creation timeout')), 2000);
        });

        const { error: userError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any;

        if (userError) {
          console.error('Error creating user profile:', userError);
        } else {
          // Set localStorage flag to prevent modal showing after regular registration
          setProfileJustCreated();
        }
      } catch (error) {
        console.error('Profile creation timeout or error:', error);
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