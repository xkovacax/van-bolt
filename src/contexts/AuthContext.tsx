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

// Helper function to clean up expired preferred role
const cleanupExpiredPreferredRole = () => {
  try {
    const storedData = localStorage.getItem('preferredRole');
    if (storedData) {
      const { expiry } = JSON.parse(storedData);
      if (Date.now() > expiry) {
        console.log('🧹 Cleaning up expired preferred role');
        localStorage.removeItem('preferredRole');
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up preferred role:', error);
    localStorage.removeItem('preferredRole');
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  
  // CRITICAL: Track if we just created a profile to prevent modal re-showing
  const [justCreatedProfile, setJustCreatedProfile] = useState(false);

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    
    // Clean up any expired preferred roles on startup
    cleanupExpiredPreferredRole();
    
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
    setJustCreatedProfile(false);
    setLoading(false);
  };

  // OPTIMIZED: Separate function to fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log('📊 Fetching user profile from database for:', userId);
    
    try {
      const queryStartTime = Date.now();
      
      const queryPromise = supabase
        .from('users')
        .select('id, name, email, role, avatar, rating, review_count')
        .eq('id', userId)
        .limit(1)
        .maybeSingle();

      // 3 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Database query timeout (3s)'));
        }, 3000);
      });

      const { data: userProfile, error: dbError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      const queryTime = Date.now() - queryStartTime;
      console.log(`📊 Profile fetch completed in ${queryTime}ms`);

      if (dbError) {
        console.error('❌ Error fetching user profile:', dbError);
        return null;
      }

      if (userProfile) {
        console.log('✅ User profile fetched successfully:', userProfile);
        return {
          id: userProfile.id,
          name: userProfile.name || 'User',
          email: userProfile.email || '',
          role: userProfile.role,
          avatar: userProfile.avatar,
          rating: userProfile.rating,
          reviewCount: userProfile.review_count
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      return null;
    }
  };

  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    console.log('👤 ===== STARTING handleUserSession =====');
    console.log('👤 User ID:', supabaseUser.id);
    console.log('👤 User email:', supabaseUser.email);
    console.log('🔒 Just created profile flag:', justCreatedProfile);
    
    // CRITICAL: If we just created a profile, skip the modal logic entirely
    if (justCreatedProfile) {
      console.log('🚫 SKIPPING modal logic - profile was just created');
      
      // Fetch the fresh profile from database
      const userProfile = await fetchUserProfile(supabaseUser.id);
      if (userProfile) {
        console.log('✅ Setting user from fresh profile after creation');
        setUser(userProfile);
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        // Reset the flag after successful load
        setJustCreatedProfile(false);
        
        console.log('🎯 MODAL CHECK: Profile just created, user loaded', {
          needsSetup: false,
          hasPendingData: false,
          modalShouldShow: false,
          hasUser: true,
          userName: userProfile.name,
          userRole: userProfile.role,
          reason: 'just_created_profile',
          timestamp: new Date().toISOString()
        });
        
        console.log('👤 ===== ENDING handleUserSession (JUST CREATED) =====');
        return;
      } else {
        console.error('❌ Failed to fetch profile after creation - falling back to normal flow');
        setJustCreatedProfile(false);
      }
    }
    
    try {
      console.log('📊 STEP 1: Checking user profile in database...');
      
      // Check for preferred role from localStorage (Google OAuth flow)
      // CRITICAL: Don't remove it yet - only read it
      const preferredRole = getPreferredRole();
      if (preferredRole) {
        console.log('🎯 Found preferred role from localStorage (keeping for modal):', preferredRole);
      }
      
      // Fetch user profile using the optimized function
      const userProfile = await fetchUserProfile(supabaseUser.id);

      // Check if user profile exists
      if (userProfile) {
        console.log('✅ User profile found and loaded');
        
        // CRITICAL: Clean up preferred role ONLY when user profile exists
        if (preferredRole) {
          console.log('🧹 User profile exists - cleaning up preferred role from localStorage');
          localStorage.removeItem('preferredRole');
        }
        
        // Set user and ensure modal state is cleared
        setUser(userProfile);
        
        // Clear any pending modal state
        setNeedsProfileSetup(false);
        setPendingUserData(null);
        setLoading(false);
        
        console.log('🎯 MODAL CHECK: User profile loaded', {
          needsSetup: false,
          hasPendingData: false,
          modalShouldShow: false,
          hasUser: true,
          userName: userProfile.name,
          userRole: userProfile.role,
          reason: 'profile_found',
          timestamp: new Date().toISOString()
        });
      } else {
        // No profile found - need profile setup
        console.log('🎯 No profile found - triggering setup modal');
        const pendingData = setupPendingProfile(supabaseUser, preferredRole);
        
        console.log('🎯 MODAL CHECK: No profile found, setup needed', {
          needsSetup: true,
          hasPendingData: !!pendingData,
          modalShouldShow: true,
          reason: 'no_profile_found',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleUserSession:', error);
      
      // On critical error, create fallback user to prevent modal flash
      console.log('🎯 CRITICAL ERROR FALLBACK: Creating fallback user');
      createFallbackUser(supabaseUser);
      
      console.log('🎯 MODAL CHECK: Critical error, fallback created', {
        needsSetup: false,
        hasPendingData: false,
        modalShouldShow: false,
        reason: 'critical_error_fallback',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('👤 ===== ENDING handleUserSession =====');
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
    setJustCreatedProfile(false);
    setLoading(false);
  };

  // Helper function to setup pending profile - RETURNS PENDING DATA FOR SYNC CHECK
  const setupPendingProfile = (supabaseUser: SupabaseUser, preferredRole?: string | null) => {
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || 
            supabaseUser.email?.split('@')[0] || 'User',
      avatar: supabaseUser.user_metadata?.avatar_url || 
              supabaseUser.user_metadata?.picture,
      preferredRole: preferredRole as 'owner' | 'customer' || undefined
    };
    
    console.log('📝 Setting up pending profile:', userData);
    console.log('🎯 Preferred role will be preserved for modal:', preferredRole);
    
    // Set modal state
    setPendingUserData(userData);
    setNeedsProfileSetup(true);
    setUser(null);
    setJustCreatedProfile(false);
    setLoading(false);
    
    console.log('🎯 Profile setup modal should now show');
    
    // Return userData for synchronous checking
    return userData;
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

      console.log('🔨 Inserting into database with 5 second timeout...');
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

      // 5 second timeout for insert
      const insertTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('⏰ INSERT TIMEOUT: Profile creation timeout after 5 seconds');
          reject(new Error('Profile creation timeout (5s)'));
        }, 5000);
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

      // CRITICAL: Set the flag to prevent modal re-showing
      console.log('🔒 Setting justCreatedProfile flag to prevent modal re-showing');
      setJustCreatedProfile(true);

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

      // SYNCHRONOUS CHECK AFTER PROFILE CREATION
      console.log('🎯 MODAL CHECK: Profile created successfully', {
        needsSetup: false,
        hasPendingData: false,
        modalShouldShow: false,
        hasUser: true,
        userName: userFromDb.name,
        userRole: userFromDb.role,
        justCreatedProfile: true,
        reason: 'profile_created',
        timestamp: new Date().toISOString()
      });

      console.log('🎉 Profile setup completed successfully');
      console.log('🔨 ===== ENDING createUserProfile =====');
      return { error: null };
    } catch (error) {
      console.error('❌ Profile creation error:', error);
      setJustCreatedProfile(false);
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
    
    // Clean up any stored preferred role on logout
    localStorage.removeItem('preferredRole');
    
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
          setTimeout(() => reject(new Error('Profile creation timeout')), 5000);
        });

        const { error: userError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any;

        if (userError) {
          console.error('Error creating user profile:', userError);
        } else {
          // Set flag to prevent modal showing after regular registration
          setJustCreatedProfile(true);
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
    setJustCreatedProfile(false);
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