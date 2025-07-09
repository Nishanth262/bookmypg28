import { create } from 'zustand'
import { User } from '../lib/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  otpSent: boolean
  otpEmail: string | null
  error: string | null
  sendLoginOtp: (email: string) => Promise<void>
  verifyLoginOtp: (email: string, otp: string) => Promise<void>
  sendSignupOtp: (email: string) => Promise<void>
  verifySignupOtp: (name: string, email: string, phone: string, otp: string, role?: string) => Promise<void>
  sendForgotPasswordOtp: (email: string) => Promise<void>
  verifyForgotPasswordOtp: (email: string, otp: string) => Promise<{ resetToken: string; userId: string }>
  resendOtp: (email: string, type: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD') => Promise<void>
  logout: () => void
  clearOtpState: () => void
  clearError: () => void
}

const API_BASE_URL = '/api'

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  otpSent: false,
  otpEmail: null,
  error: null,
  
  sendLoginOtp: async (email: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }
      
      set({ 
        otpSent: true, 
        otpEmail: data.email, 
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to send OTP'
      })
      throw error
    }
  },
  
  verifyLoginOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP')
      }
      
      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false,
        otpSent: false,
        otpEmail: null,
        error: null
      })
      
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Invalid OTP'
      })
      throw error
    }
  },
  
  sendSignupOtp: async (email: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }
      
      set({ 
        otpSent: true, 
        otpEmail: data.email, 
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to send OTP'
      })
      throw error
    }
  },
  
  verifySignupOtp: async (name: string, email: string, phone: string, otp: string, role = 'USER') => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, otp, role }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP')
      }
      
      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false,
        otpSent: false,
        otpEmail: null,
        error: null
      })
      
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Invalid OTP'
      })
      throw error
    }
  },

  sendForgotPasswordOtp: async (email: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }
      
      set({ 
        otpSent: true, 
        otpEmail: data.email, 
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to send OTP'
      })
      throw error
    }
  },

  verifyForgotPasswordOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP')
      }
      
      set({ 
        isLoading: false,
        otpSent: false,
        otpEmail: null,
        error: null
      })
      
      return { resetToken: data.resetToken, userId: data.userId }
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Invalid OTP'
      })
      throw error
    }
  },
  
  resendOtp: async (email: string, type: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD') => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP')
      }
      
      set({ isLoading: false, error: null })
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to resend OTP'
      })
      throw error
    }
  },
  
  logout: () => {
    set({ 
      user: null, 
      isAuthenticated: false,
      otpSent: false,
      otpEmail: null,
      error: null
    })
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
  
  clearOtpState: () => {
    set({ 
      otpSent: false, 
      otpEmail: null,
      error: null
    })
  },

  clearError: () => {
    set({ error: null })
  }
}))