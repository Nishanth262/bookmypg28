import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Property, PropertyType, BookingRequest } from '../../lib/types'
import { useAuthStore } from '../../store/authStore'
import { useBookingStore } from '../../store/bookingStore'
import { Button } from '../ui/button'
import { formatPrice } from '../../lib/utils'
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface MonthlyBookingFormProps {
  property: Property
  selectedRoomType: PropertyType
  onClose: () => void
}

export const MonthlyBookingForm: React.FC<MonthlyBookingFormProps> = ({
  property,
  selectedRoomType,
  onClose
}) => {
  const { user } = useAuthStore()
  const { createBooking, isLoading } = useBookingStore()
  
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1)
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [durationMonths, setDurationMonths] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const getRoomPrice = () => {
    switch (selectedRoomType) {
      case 'SINGLE': return property.singlePrice
      case 'DOUBLE': return property.doublePrice
      case 'TRIPLE': return property.triplePrice
      case 'QUAD': return property.quadPrice
      default: return 0
    }
  }

  const getRoomLabel = () => {
    switch (selectedRoomType) {
      case 'SINGLE': return 'Single Sharing'
      case 'DOUBLE': return '2 Sharing'
      case 'TRIPLE': return '3 Sharing'
      case 'QUAD': return '4 Sharing'
      default: return selectedRoomType
    }
  }

  const monthlyPrice = getRoomPrice()
  const totalAmount = monthlyPrice * durationMonths
  const startDate = new Date(startYear, startMonth - 1, 1)
  const endDate = new Date(startYear, startMonth - 1 + durationMonths, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Please login to make a booking')
      return
    }

    try {
      const bookingRequest: BookingRequest = {
        propertyId: property.id,
        roomType: selectedRoomType,
        startMonth,
        startYear,
        durationMonths
      }

      await createBooking(bookingRequest)
      setSuccess(true)
      
      // Simulate payment process
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to create booking')
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i)

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-8 text-center"
      >
        <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
        <p className="text-gray-600 mb-4">
          Your booking request has been submitted successfully. You will receive a confirmation email shortly.
        </p>
        <Button onClick={onClose}>Close</Button>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Book Your Stay</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-primary-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">{getRoomLabel()}</span>
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(monthlyPrice)}/month
          </span>
        </div>
        <p className="text-sm text-gray-600">{property.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Month
            </label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              className="input"
              required
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="input"
              required
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (Months)
          </label>
          <select
            value={durationMonths}
            onChange={(e) => setDurationMonths(parseInt(e.target.value))}
            className="input"
            required
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {month} {month === 1 ? 'Month' : 'Months'}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Start Date
            </span>
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              End Date
            </span>
            <span>{endDate.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Duration
            </span>
            <span>{durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Room Type
            </span>
            <span>{getRoomLabel()}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Total Amount
              </span>
              <span className="text-lg text-primary-600">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Secure payment powered by Razorpay</p>
        <p>No charges until booking is confirmed</p>
      </div>
    </div>
  )
}