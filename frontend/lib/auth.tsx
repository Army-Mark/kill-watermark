'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { User, api } from './api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      api.getProfile().then((res) => {
        if (res.success && res.data) {
          setUser(res.data)
        }
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password)
    if (res.success && res.data) {
      localStorage.setItem('auth_token', res.data.token)
      setUser(res.data.user)
    } else {
      throw new Error(res.error || '登录失败')
    }
  }

  const register = async (username: string, password: string) => {
    const res = await api.register(username, password)
    if (res.success && res.data) {
      localStorage.setItem('auth_token', res.data.token)
      setUser(res.data.user)
    } else {
      throw new Error(res.error || '注册失败')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
