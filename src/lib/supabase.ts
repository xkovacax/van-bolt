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
  },
  // PERFORMANCE OPTIMIZATION: Add connection settings for faster queries
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// ULTRA-FAST connection test with aggressive timeout
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection with 2 second timeout...');
    const startTime = Date.now();
    
    // ULTRA-FAST test query with aggressive timeout
    const testPromise = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    // AGGRESSIVE 2 second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection test timeout (2s) - Supabase too slow'));
      }, 2000);
    });
    
    const { data, error, count } = await Promise.race([
      testPromise,
      timeoutPromise
    ]) as any;
    
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
        console.log('💡 Please click "Connect to Supabase" button to set up the database');
      } else {
        console.log('🚨 SLOW DATABASE WARNING: Supabase queries are taking too long');
        console.log('💡 This may cause authentication issues and modal flashing');
      }
    } else {
      if (testTime > 1000) {
        console.warn(`⚠️ Supabase connection SLOW: ${testTime}ms (should be <1000ms)`);
        console.log('🚨 WARNING: Slow database will cause authentication delays');
      } else {
        console.log(`✅ Supabase connection test successful in ${testTime}ms`);
      }
      console.log(`📊 Users table exists with ${count || 0} records`);
    }
  } catch (err) {
    const testTime = Date.now() - Date.now();
    console.error('❌ Supabase connection test error:', {
      name: err.name,
      message: err.message,
      testTime: `${testTime}ms`
    });
    
    if (err.message?.includes('timeout')) {
      console.log('🚨 CRITICAL: Supabase connection is too slow (>2s)');
      console.log('💡 This will cause authentication issues and modal problems');
      console.log('🔧 Consider using a different Supabase region or checking network');
    }
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