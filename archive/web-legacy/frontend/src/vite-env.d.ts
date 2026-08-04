/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // Payment API Configuration
  readonly VITE_PAYMENT_API_URL: string
  
  // App Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  
  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_QR_MEDIA: string
  readonly VITE_ENABLE_PAYMENT: string
  readonly VITE_ENABLE_GOOGLE_OAUTH: string
  
  // Optional Services
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
