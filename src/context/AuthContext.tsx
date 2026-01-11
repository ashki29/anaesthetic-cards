/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User, Team } from '../lib/types'

interface AuthContextType {
  session: Session | null
  user: SupabaseUser | null
  profile: User | null
  team: Team | null
  loading: boolean
  initError: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  joinTeam: (inviteCode: string) => Promise<{ error: Error | null }>
  createTeam: (name: string) => Promise<{ error: Error | null; inviteCode?: string }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  const fetchProfile = async (userId: string) => {
    try {
      // Clear any stale state while we refetch.
      setInitError(null)
      setProfile(null)
      setTeam(null)

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        setInitError(profileError.message)
        return
      }

      if (!profileData) {
        setInitError('No user profile found. Please contact support or try signing out and back in.')
        return
      }

      setProfile(profileData)

      if (!profileData.team_id) {
        setTeam(null)
        return
      }

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', profileData.team_id)
        .single()

      if (teamError) {
        setInitError(teamError.message)
        setTeam(null)
        return
      }

      setTeam(teamData ?? null)
    } catch (err) {
      setInitError(err instanceof Error ? err.message : 'Failed to fetch profile')
      setProfile(null)
      setTeam(null)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    let cancelled = false

    // Fail-safe so the UI doesn't sit on "Loading..." forever if Supabase is unreachable.
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return
      setInitError('Timed out connecting to Supabase. Check your network and Supabase URL/key.')
      setLoading(false)
    }, 10_000)

    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (cancelled) return

        if (error) {
          setInitError(error.message)
        } else {
          setInitError(null)
        }

        const session = data.session
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        if (cancelled) return
        setInitError(err instanceof Error ? err.message : 'Failed to initialize auth')
      } finally {
        window.clearTimeout(timeoutId)
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (cancelled) return
        setLoading(true)
        setInitError(null)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setTeam(null)
        }
      } catch (err) {
        if (cancelled) return
        setInitError(err instanceof Error ? err.message : 'Auth state update failed')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setTeam(null)
  }

  const joinTeam = async (inviteCode: string) => {
    if (!user?.id) {
      return { error: new Error('You must be signed in to join a team') }
    }

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (teamError || !teamData) {
      return { error: new Error('Invalid invite code') }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ team_id: teamData.id })
      .eq('id', user.id)

    if (updateError) {
      return { error: updateError as Error }
    }

    await refreshProfile()
    return { error: null }
  }

  const createTeam = async (name: string) => {
    if (!user?.id) {
      return { error: new Error('You must be signed in to create a team') }
    }

    const inviteCode = generateInviteCode()

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({ name, invite_code: inviteCode })
      .select()
      .single()

    if (teamError || !teamData) {
      return { error: teamError as Error | null }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ team_id: teamData.id })
      .eq('id', user.id)

    if (updateError) {
      return { error: updateError as Error }
    }

    await refreshProfile()
    return { error: null, inviteCode }
  }

  const value = {
    session,
    user,
    profile,
    team,
    loading,
    initError,
    signIn,
    signUp,
    signOut,
    joinTeam,
    createTeam,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
