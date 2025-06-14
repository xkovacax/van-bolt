import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface UserServiceResult {
  user: User | null;
  needsProfileSetup: boolean;
  error: string | null;
}

/**
 * 🎯 SINGLE QUERY: Check if user exists and get their data
 * Returns either user data or indicates profile setup is needed
 */
export const getUserProfile = async (userId: string): Promise<UserServiceResult> => {
  console.log('🔍 UserService: Getting profile for user:', userId);
  
  try {
    const queryStartTime = Date.now();
    
    // 🎯 SINGLE DATABASE QUERY - ULTRA OPTIMIZED
    const { data: userProfile, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, rating, review_count')
      .eq('id', userId)
      .limit(1)
      .single();

    const queryTime = Date.now() - queryStartTime;
    console.log(`📊 UserService: Query completed in ${queryTime}ms`);

    // Handle database errors
    if (dbError) {
      console.log('❌ UserService: Database error:', {
        code: dbError.code,
        message: dbError.message,
        queryTime: `${queryTime}ms`
      });
      
      // Check if it's "no rows" error (user doesn't exist)
      if (dbError.code === 'PGRST116' || dbError.message?.includes('no rows')) {
        console.log('🎯 UserService: User profile not found - needs setup');
        return {
          user: null,
          needsProfileSetup: true,
          error: null
        };
      } else {
        // Other database error
        console.error('🚨 UserService: Database connection error:', dbError);
        return {
          user: null,
          needsProfileSetup: false,
          error: `Database error: ${dbError.message}`
        };
      }
    }

    if (userProfile) {
      // ✅ USER EXISTS IN DATABASE - USE EXACT DATABASE DATA
      console.log('✅ UserService: User profile found:', userProfile);
      
      const userData: User = {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role as 'owner' | 'customer',
        avatar: userProfile.avatar,
        rating: userProfile.rating,
        reviewCount: userProfile.review_count
      };
      
      console.log('🎯 UserService: Returning user with role:', userData.role);
      
      return {
        user: userData,
        needsProfileSetup: false,
        error: null
      };
    }

    // Fallback - should not reach here
    return {
      user: null,
      needsProfileSetup: true,
      error: null
    };

  } catch (error) {
    console.error('❌ UserService: Critical error:', error);
    return {
      user: null,
      needsProfileSetup: true,
      error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * 🔨 Create user profile in database
 */
export const createUserProfile = async (userData: {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'customer';
}): Promise<{ user: User | null; error: string | null }> => {
  console.log('🔨 UserService: Creating profile:', userData);
  
  try {
    // Generate default avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&size=150&background=059669&color=fff&bold=true`;

    const insertStartTime = Date.now();
    
    // 🎯 SINGLE INSERT with EXACT role specified by user
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: userData.id,
          name: userData.name.trim(),
          email: userData.email,
          role: userData.role,
          avatar: avatarUrl,
          rating: 5.0,
          review_count: 0
        }
      ])
      .select('id, name, email, role, avatar, rating, review_count')
      .single();

    const insertTime = Date.now() - insertStartTime;
    console.log(`🔨 UserService: Insert completed in ${insertTime}ms`);

    if (dbError) {
      console.error('❌ UserService: Database insert error:', dbError);
      return {
        user: null,
        error: `Failed to create profile: ${dbError.message}`
      };
    }

    console.log('✅ UserService: Profile created successfully:', newUser);
    
    const createdUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as 'owner' | 'customer',
      avatar: newUser.avatar,
      rating: newUser.rating,
      reviewCount: newUser.review_count
    };

    return {
      user: createdUser,
      error: null
    };

  } catch (error) {
    console.error('❌ UserService: Profile creation error:', error);
    return {
      user: null,
      error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * 🔍 Check if user has access token (is authenticated)
 */
export const hasAccessToken = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch (error) {
    console.error('❌ UserService: Error checking access token:', error);
    return false;
  }
};

/**
 * 🔍 Get current authenticated user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('❌ UserService: Error getting user ID:', error);
    return null;
  }
};

/**
 * 🔍 Get user metadata from auth (for profile setup)
 */
export const getUserMetadata = async (): Promise<{
  id: string;
  email: string;
  name: string;
  avatar?: string;
} | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const user = session.user;
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 'User',
      avatar: user.user_metadata?.avatar_url || 
              user.user_metadata?.picture
    };
  } catch (error) {
    console.error('❌ UserService: Error getting user metadata:', error);
    return null;
  }
};