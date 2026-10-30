import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AuthError, User } from '@supabase/supabase-js'
import { REAL_AUTH, supabase } from '../lib/supabase'

export type Role = 'teacher' | 'student'

export interface Profile {
  id: string
  role: Role
  display_name: string
  email: string
}

export interface SignUpInput {
  email: string
  password: string
  displayName: string
  role: Role
}

// What a sign-in or sign-up gives back. `message` is already in simple language, never a raw error.
export type AuthResult =
  | { ok: true; profile: Profile }
  | { ok: false; message: string }

interface AuthValue {
  /** true when real (Supabase) sign-in is on. false = the old mock login. */
  realAuth: boolean
  user: User | null
  profile: Profile | null
  /** true while the saved session and the profile are being loaded at start. */
  loading: boolean
  signUp: (input: SignUpInput) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const MOCK: AuthValue = {
  realAuth: false,
  user: null,
  profile: null,
  loading: false,
  signUp: async () => ({ ok: false, message: 'Sign-up is not available in demo mode.' }),
  signIn: async () => ({ ok: false, message: 'Sign-in is not available in demo mode.' }),
  signOut: async () => undefined,
}

const AuthContext = createContext<AuthValue>(MOCK)

export function useAuth(): AuthValue {
  return useContext(AuthContext)
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === 'teacher' ? '/teacher' : '/home'
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Turns a Supabase error into one short, friendly sentence. The raw error is never shown.
export function friendlyAuthError(error: AuthError | { message?: string; code?: string; status?: number }, mode: 'signin' | 'signup'): string {
  const code = (error as { code?: string }).code ?? ''
  const text = (error.message ?? '').toLowerCase()
  const status = (error as { status?: number }).status
  if (code === 'invalid_credentials' || text.includes('invalid login credentials')) {
    return 'That email and password do not match. Please check them and try again.'
  }
  if (code === 'user_already_exists' || code === 'email_exists' || text.includes('already registered')) {
    return 'This email is already registered. Try signing in instead.'
  }
  if (code === 'weak_password' || text.includes('password should be') || text.includes('weak')) {
    return 'That password is too weak. Use at least 8 characters, with letters and numbers.'
  }
  if (code === 'email_address_invalid' || text.includes('invalid email') || text.includes('unable to validate email')) {
    return 'That email address does not look right. Please check it.'
  }
  if (code === 'email_not_confirmed' || text.includes('not confirmed')) {
    return 'Please confirm your email first, then sign in.'
  }
  if (code.includes('rate_limit') || status === 429 || text.includes('rate limit') || text.includes('too many')) {
    return 'Too many tries. Please wait a minute and try again.'
  }
  if (status === 0 || text.includes('failed to fetch') || text.includes('network') || text.includes('fetch')) {
    return 'We could not reach the server. Check your internet and try again.'
  }
  return mode === 'signup'
    ? 'We could not create your account. Please try again.'
    : 'We could not sign you in. Please try again.'
}

function toProfile(row: Record<string, unknown> | null): Profile | null {
  if (!row) return null
  const role = row.role === 'teacher' ? 'teacher' : row.role === 'student' ? 'student' : null
  if (!role) return null
  return {
    id: String(row.id),
    role,
    display_name: String(row.display_name ?? ''),
    email: String(row.email ?? ''),
  }
}

// Reads the signed-in user's own profile row. A new account's row is made by a database trigger, so it can
// be a moment late: if it is missing, wait a little and look once more.
async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data } = await supabase
      .from('profiles')
      .select('id, role, display_name, email')
      .eq('id', userId)
      .maybeSingle()
    const profile = toProfile(data)
    if (profile) return profile
    if (attempt === 0) await wait(700)
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(REAL_AUTH)
  const profileFor = useRef<string | null>(null) // which user the loaded profile belongs to

  // Follow the saved session: first read, then every sign-in and sign-out.
  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do the work later, not inside this callback (the library can deadlock if it is awaited here).
      setTimeout(() => {
        if (alive) setUser(session?.user ?? null)
      }, 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Load the profile whenever a different user is signed in.
  useEffect(() => {
    if (!REAL_AUTH) return
    if (!user) {
      profileFor.current = null
      setProfile(null)
      setLoading(false)
      return
    }
    if (profileFor.current === user.id) return
    let alive = true
    setLoading(true)
    fetchProfile(user.id).then((p) => {
      if (!alive) return
      profileFor.current = p ? user.id : null
      setProfile(p)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [user])

  async function finish(userId: string | undefined): Promise<AuthResult> {
    if (!userId) return { ok: false, message: 'We could not sign you in. Please try again.' }
    const p = await fetchProfile(userId)
    if (!p) return { ok: false, message: 'Your account was made, but we could not load your profile. Please try signing in again.' }
    profileFor.current = userId
    setProfile(p)
    return { ok: true, profile: p }
  }

  async function signUp({ email, password, displayName, role }: SignUpInput): Promise<AuthResult> {
    if (!supabase) return MOCK.signUp({ email, password, displayName, role })
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role, display_name: displayName.trim() } },
      })
      if (error) return { ok: false, message: friendlyAuthError(error, 'signup') }
      if (!data.session) {
        // Only happens if email confirmation is switched on in Supabase.
        return { ok: false, message: 'Account created. Please confirm your email, then sign in.' }
      }
      return await finish(data.user?.id)
    } catch (e) {
      return { ok: false, message: friendlyAuthError(e as Error, 'signup') }
    }
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return MOCK.signIn(email, password)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { ok: false, message: friendlyAuthError(error, 'signin') }
      return await finish(data.user?.id)
    } catch (e) {
      return { ok: false, message: friendlyAuthError(e as Error, 'signin') }
    }
  }

  async function signOut(): Promise<void> {
    try {
      await supabase?.auth.signOut()
    } catch {
      // even if the server cannot be reached, forget the user on this device
    }
    profileFor.current = null
    setUser(null)
    setProfile(null)
  }

  const value: AuthValue = { realAuth: REAL_AUTH, user, profile, loading, signUp, signIn, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
