import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Only the PUBLIC anon (publishable) key is used here, read from env vars. Never put the project's secret
// (admin) key in this app: anything starting with VITE_ is visible to everyone who opens the site.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Real sign-in is used ONLY when mock mode is switched off AND both Supabase values are present.
// In every other case the app keeps its mock login, so a deployment without the env vars still works.
export const REAL_AUTH: boolean = import.meta.env.VITE_USE_MOCK === 'false' && !!url && !!anonKey

// null when real sign-in is off. The session is saved in the browser by the library (default behaviour).
export const supabase: SupabaseClient | null = REAL_AUTH ? createClient(url as string, anonKey as string) : null
