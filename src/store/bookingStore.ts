import { create } from 'zustand'
import { Booking, BookingRequest } from '../lib/types'
import { generateBookingId } from '../lib/utils'

interface BookingState {
  bookings: Booking[]
  isLoading: boolean
  error: string | null
  currentBooking: Booking | null
  fetchUserBookings: (userId: string) => Promise<void>
  createBooking: (booking: BookingRequest) => Promise<Booking>
  cancelBooking: (bookingId: string) => Promise<void>
  extendBooking: (bookingId: string, additionalMonths: number) => Promise<void>
  setCurrentBooking: (booking: Booking | null) => void
}

const API_BASE_URL = 'http://localhost:5000/api'

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,
  currentBooking: null,
  
  fetchUserBookings: async (userId) => {
    set({ isLoading: true, error: null })
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE_URL}/bookings/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const bookings = await response.json()
      
      set({ 
        bookings,
        isLoading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch bookings', 
        isLoading: false 
      })
    }
  },
  
  createBooking: async (bookingData) => {
    set({ isLoading: true, error: null })
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking')
      }
      
      const newBooking = data.booking
      
      set(state => ({ 
        bookings: [newBooking, ...state.bookings],
        isLoading: false,
        currentBooking: newBooking
      }))
      
      return newBooking
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to create booking', 
        isLoading: false 
      })
      throw error
    }
  },
  
  cancelBooking: async (bookingId) => {
    set({ isLoading: true, error: null })
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking')
      }
      
      set(state => ({
        bookings: state.bookings.map(b => 
          b.id === bookingId ? { ...b, status: 'CANCELLED', isActive: false } : b
        ),
        isLoading: false
      }))
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to cancel booking', 
        isLoading: false 
      })
      throw error
    }
  },
  
  extendBooking: async (bookingId, additionalMonths) => {
    set({ isLoading: true, error: null })
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/extend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ additionalMonths })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to extend booking')
      }
      
      set(state => ({
        bookings: state.bookings.map(b => 
          b.id === bookingId ? data.booking : b
        ),
        isLoading: false
      }))
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to extend booking', 
        isLoading: false 
      })
      throw error
    }
  },
  
  setCurrentBooking: (booking) => {
    set({ currentBooking: booking })
  }
}))