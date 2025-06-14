import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'mycamper-web'
    }
  }
});

// Simple connection test without timeout
const testConnection = async () => {
  try {
    const startTime = Date.now();
    
    const { error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const testTime = Date.now() - startTime;
    
    if (error) {
      console.error(`❌ Supabase connection test failed in ${testTime}ms:`, error.message);
    } else {
      console.log(`✅ Supabase connection test successful in ${testTime}ms`);
    }
  } catch (err) {
    console.error('❌ Supabase connection test error:', err.message);
  }
};

// Run connection test
testConnection();

// Get the current origin for redirect URLs
export const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:5173/auth/callback'; // Fallback for Vite default port
};