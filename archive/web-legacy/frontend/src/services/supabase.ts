import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const appEnv = import.meta.env.VITE_APP_ENV || 'development'

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const envFile = appEnv === 'production' ? '.env' : '.env.local'
  console.error('❌ Supabase environment variables are missing!')
  console.error(`Please set the following in frontend/${envFile}:`)
  console.error('VITE_SUPABASE_URL=your_project_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key')
  
  if (appEnv === 'production') {
    throw new Error('Supabase credentials are required for production')
  }
}

// Create Supabase client with environment-specific settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: appEnv === 'production', // Only in production
    debug: appEnv === 'development' // Debug logs in development
  },
  global: {
    headers: {
      'X-Client-Info': `davetim-web@1.0.0`
    }
  }
})

// Log initialization (development only)
if (appEnv === 'development') {
  console.log('✅ Supabase initialized (Development)')
  console.log('📍 URL:', supabaseUrl)
}

// Database type definitions (will be generated from Supabase later)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'premium'
          subscription_end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'premium'
          subscription_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'premium'
          subscription_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
