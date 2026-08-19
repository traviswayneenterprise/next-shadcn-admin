'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  permissions?: string[]
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  register: (data: { name: string; email: string; password: string }) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>
  verifyEmail: (data: { email: string; token: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })

      if (response.ok) {
        const json = await response.json()
        if (json?.data?.user) {
          setUser(json.data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch('/api/v1/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'same-origin',
      })

      const json = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: json?.error?.message || 'Login failed. Please check your credentials.',
        }
      }

      if (json?.data?.user) {
        setUser(json.data.user)
      } else {
        await refreshSession()
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during login.',
      }
    }
  }

  const register = async (data: { name: string; email: string; password: string }) => {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      })

      const json = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: json?.error?.message || 'Registration failed. Please try again.',
        }
      }

      return {
        success: true,
        requiresEmailVerification: json?.data?.requiresEmailVerification ?? true,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during registration.',
      }
    }
  }

  const verifyEmail = async (data: { email: string; token: string }) => {
    try {
      const response = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      })

      const json = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: json?.error?.message || 'Verification failed. Token may be invalid or expired.',
        }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during email verification.',
      }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null)
      router.push('/auth/sign-in')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        verifyEmail,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
