import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  loginWithGoogle: () => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: 'owner' | 'customer') => Promise<{ error: AuthError | null }>;
  isAuthenticated: boolean;
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const newProfile = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email!,
          role: 'customer' as const,
          avatar: supabaseUser.user_metadata?.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`,
          rating: 5.0,
          review_count: 0
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          setLoading(false);
          return;
        }

        setUser({
          id: createdProfile.id,
          name: createdProfile.name,
          email: createdProfile.email,
          role: createdProfile.role,
          avatar: createdProfile.avatar,
          rating: createdProfile.rating,
          reviewCount: createdProfile.review_count
        });
      } else if (error) {
        console.error('Error fetching profile:', error);
      } else if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          avatar: profile.avatar,
          rating: profile.rating,
          reviewCount: profile.review_count
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    return { error };
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
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

    // If user is created, create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name,
            email,
            role,
            avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`,
            rating: 5.0,
            review_count: 0
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    setLoading(false);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    login,
    loginWithGoogle,
    logout,
    register,
    isAuthenticated: !!session
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};