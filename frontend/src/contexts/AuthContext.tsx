/// <reference types="vite/client" />
import React, { createContext, useContext, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface User {
  id: string
  email: string
}

interface Session {
  user: User
  token: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: 'student' | 'faculty'
  avatar_url?: string
  bio?: string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'faculty') => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from backend
  async function fetchProfile(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setProfile({
          id: data.data.id,
          full_name: data.data.full_name,
          email: data.data.email,
          role: data.data.role,
          avatar_url: data.data.avatar_url,
          bio: data.data.bio,
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    
    const verifyAndSetLoading = async () => {
      if (storedToken) {
        // Verify token is still valid by fetching profile
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              const userData: User = {
                id: data.data.id,
                email: data.data.email,
              }
              const sessionData: Session = {
                user: userData,
                token: storedToken,
              }
              setSession(sessionData)
              setUser(userData)
              setProfile({
                id: data.data.id,
                full_name: data.data.full_name,
                email: data.data.email,
                role: data.data.role,
                avatar_url: data.data.avatar_url,
                bio: data.data.bio,
              })
            }
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('auth_token')
          }
        } catch (err) {
          console.error('Token verification failed:', err)
          localStorage.removeItem('auth_token')
        }
      }
      
      // Always set loading to false
      setLoading(false)
    }

    verifyAndSetLoading()
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        return { error: data.message || 'Sign in failed' }
      }

      const data = await response.json()
      
      if (data.success && data.token) {
        const userData: User = {
          id: data.data.id,
          email: data.data.email,
        }
        const sessionData: Session = {
          user: userData,
          token: data.token,
        }

        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)

        setSession(sessionData)
        setUser(userData)
        setProfile({
          id: data.data.id,
          full_name: data.data.full_name,
          email: data.data.email,
          role: data.data.role,
          avatar_url: data.data.avatar_url,
          bio: data.data.bio,
        })

        return { error: null }
      }

      return { error: 'Sign in failed' }
    } catch (err: any) {
      return { error: err?.message ?? 'Sign in failed' }
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: 'student' | 'faculty') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      })

      if (!response.ok) {
        const data = await response.json()
        return { error: data.message || 'Sign up failed' }
      }

      const data = await response.json()

      if (data.success && data.token) {
        const userData: User = {
          id: data.data.id,
          email: data.data.email,
        }
        const sessionData: Session = {
          user: userData,
          token: data.token,
        }

        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)

        setSession(sessionData)
        setUser(userData)
        setProfile({
          id: data.data.id,
          full_name: data.data.full_name,
          email: data.data.email,
          role: data.data.role,
        })

        return { error: null }
      }

      return { error: 'Sign up failed' }
    } catch (err: any) {
      return { error: err?.message ?? 'Sign up failed' }
    }
  }

  async function signOut() {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    }

    // Clear local state regardless of API response
    localStorage.removeItem('auth_token')
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    const token = localStorage.getItem('auth_token')
    if (token) {
      await fetchProfile(token)
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
