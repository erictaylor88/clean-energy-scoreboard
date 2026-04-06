import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role key
// Used in: Server Components, API routes, Cron jobs
// Never expose this client to the browser
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

// Read-only client using anon key (for ISR server components)
export function createReadClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
}
