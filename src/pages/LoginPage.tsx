import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Phone, Shield, AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react'

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  const { 
    sendLoginOtp, 
    verifyLoginOtp, 
    resendOtp,
    isLoading, 
    isAuthenticated, 
    otpSent, 
    otpPhone,
    error,
    clearOtpState,
    clearError
  } = useAuthStore()
  
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Login | BookMyPG'
    
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // Clear error when component unmounts or when user starts typing
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Limit to 10 digits for Indian mobile numbers
    const limitedDigits = digits.slice(0, 10)
    
    // Add country code if not present and we have 10 digits
    if (limitedDigits.length === 10 && limitedDigits.startsWith('6789'.charAt(0))) {
      return '+91' + limitedDigits
    }
    
    return limitedDigits
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!phone) {
      return
    }
    
    const formattedPhone = formatPhoneNumber(phone)
    
    // Validate phone number
    if (formattedPhone.length < 10) {
      return
    }
    
    try {
      await sendLoginOtp(formattedPhone)
      setCountdown(60) // Start 60 second countdown
    } catch (error: any) {
      // Error is handled by the store
      console.error('Login OTP error:', error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!otp || otp.length !== 6) {
      return
    }
    
    try {
      await verifyLoginOtp(otpPhone!, otp)
      navigate('/')
    } catch (error: any) {
      // Error is handled by the store
      console.error('Verify OTP error:', error)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    clearError()
    try {
      await resendOtp(otpPhone!, 'LOGIN')
      setCountdown(60)
    } catch (error: any) {
      // Error is handled by the store
      console.error('Resend OTP error:', error)
    }
  }

  const handleBack = () => {
    clearOtpState()
    setOtp('')
    clearError()
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError()
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(value)
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError()
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <img 
                    src="/src/assets/P G.png" 
                    alt="BookMyPG Logo" 
                    className="h-8 w-8 object-cover rounded-full"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {otpSent ? 'Verify OTP' : 'Welcome Back'}
              </h1>
              <p className="text-gray-600">
                {otpSent 
                  ? `Enter the 6-digit code sent to ${otpPhone}`
                  : 'Sign in to access your BookMyPG account'
                }
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">+91</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="pl-16"
                        maxLength={10}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send you a verification code
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || phone.length < 10}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={handleOtpChange}
                        className="pl-10 text-center text-lg tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Development mode: Check console for OTP
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        'Verify & Login'
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || isLoading}
                      className={`text-sm ${
                        countdown > 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-primary-600 hover:text-primary-500'
                      } flex items-center justify-center w-full`}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {countdown > 0 
                        ? `Resend OTP in ${countdown}s` 
                        : 'Resend OTP'
                      }
                    </button>
                  </div>
                </div>
              </form>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default LoginPage