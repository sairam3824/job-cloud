import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing! Please check your .env.local file.")
}

// Create client with fallback values to prevent build/runtime crashes if envs are missing
// Requests will fail gracefully in the app rather than crashing the server
export const supabase = createClient(
    supabaseUrl || 'https://your-project.supabase.co',
    supabaseAnonKey || 'your-anon-key'
)
