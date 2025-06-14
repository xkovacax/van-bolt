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

// Enhanced connection test with better error handling
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const startTime = Date.now();
    
    // Test with a simple query that should always work
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const testTime = Date.now() - startTime;
    
    if (error) {
      console.error(`❌ Supabase connection test failed in ${testTime}ms:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('⚠️ Users table does not exist - this is expected for new projects');
        console.log('💡 Please run: Connect to Supabase button to set up the database');
      }
    } else {
      console.log(`✅ Supabase connection test successful in ${testTime}ms`);
      console.log(`📊 Users table exists with ${count || 0} records`);
    }
  } catch (err) {
    console.error('❌ Supabase connection test error:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
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