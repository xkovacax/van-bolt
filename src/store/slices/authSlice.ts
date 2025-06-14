import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '@supabase/supabase-js';
import { User } from '../../types';
import { getUserProfile, createUserProfile } from '../../services/userService';
import { supabase, getRedirectUrl } from '../../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsProfileSetup: boolean;
  pendingUserData: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  } | null;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  needsProfileSetup: false,
  pendingUserData: null,
  error: null,
  isAuthenticated: false,
};

// 🎯 ASYNC THUNK: Handle user session
export const handleUserSession = createAsyncThunk(
  'auth/handleUserSession',
  async (session: Session | null, { rejectWithValue }) => {
    console.log('🎯 Redux: handleUserSession', !!session);
    
    if (!session?.user) {
      return { type: 'NO_SESSION' };
    }

    try {
      // 🎯 SINGLE QUERY: Check user profile
      const { user: userProfile, needsProfileSetup, error } = await getUserProfile(session.user.id);
      
      if (error) {
        return rejectWithValue(error);
      }

      if (needsProfileSetup) {
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
        
        return {
          type: 'NEEDS_PROFILE_SETUP',
          session,
          pendingUserData: pendingData
        };
      }

      if (userProfile) {
        return {
          type: 'USER_LOADED',
          session,
          user: userProfile
        };
      }

      return rejectWithValue('Unknown user state');
    } catch (error) {
      console.error('❌ Redux: handleUserSession error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// 🎯 ASYNC THUNK: Complete profile setup
export const completeProfileSetup = createAsyncThunk(
  'auth/completeProfileSetup',
  async (profileData: { name: string; role: 'owner' | 'customer' }, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const { pendingUserData } = state.auth;
    
    if (!pendingUserData) {
      return rejectWithValue('No pending user data');
    }

    try {
      const { user, error } = await createUserProfile({
        id: pendingUserData.id,
        name: profileData.name,
        email: pendingUserData.email,
        role: profileData.role
      });

      if (error) {
        return rejectWithValue(error);
      }

      if (!user) {
        return rejectWithValue('Failed to create user profile');
      }

      return user;
    } catch (error) {
      console.error('❌ Redux: completeProfileSetup error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// 🎯 ASYNC THUNK: Login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return rejectWithValue(error.message);
      }
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

// 🎯 ASYNC THUNK: Google login
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
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
      
      if (error) {
        return rejectWithValue(error.message);
      }
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Google login failed');
    }
  }
);

// 🎯 ASYNC THUNK: Register
export const register = createAsyncThunk(
  'auth/register',
  async ({ 
    name, 
    email, 
    password, 
    role 
  }: { 
    name: string; 
    email: string; 
    password: string; 
    role: 'owner' | 'customer' 
  }, { rejectWithValue }) => {
    try {
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
        return rejectWithValue(error.message);
      }

      return { user: data.user, role };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

// 🎯 ASYNC THUNK: Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return rejectWithValue(error.message);
      }
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.session = null;
      state.loading = false;
      state.needsProfileSetup = false;
      state.pendingUserData = null;
      state.error = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle user session
      .addCase(handleUserSession.pending, (state) => {
        state.loading = true;
        state.error = null;
        // 🎯 CRITICAL: Clear modal state immediately when loading starts
        state.needsProfileSetup = false;
        state.pendingUserData = null;
      })
      .addCase(handleUserSession.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload.type === 'NO_SESSION') {
          state.user = null;
          state.session = null;
          state.isAuthenticated = false;
          state.needsProfileSetup = false;
          state.pendingUserData = null;
        } else if (action.payload.type === 'NEEDS_PROFILE_SETUP') {
          state.session = action.payload.session;
          state.isAuthenticated = true;
          state.user = null;
          state.needsProfileSetup = true;
          state.pendingUserData = action.payload.pendingUserData;
        } else if (action.payload.type === 'USER_LOADED') {
          state.session = action.payload.session;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.needsProfileSetup = false;
          state.pendingUserData = null;
        }
      })
      .addCase(handleUserSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Complete profile setup
      .addCase(completeProfileSetup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeProfileSetup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.needsProfileSetup = false;
        state.pendingUserData = null;
      })
      .addCase(completeProfileSetup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Google login
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.loading = false;
        state.needsProfileSetup = false;
        state.pendingUserData = null;
        state.error = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSession, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;