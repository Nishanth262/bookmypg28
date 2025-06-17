import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  Phone, 
  Shield, 
  AlertCircle, 
  ArrowLeft, 
  RotateCcw, 
  User, 
  Mail,
  UserCheck
} from 'lucide-react'

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER'
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  const { 
    sendSignupOtp, 
    verifySignupOtp, 
    resendOtp,
    isLoading, 
    isAuthenticated, 
    otpSent, 
    otpPhone,
    clearOtpState
  } = useAuthStore()
  
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Register | BookMyPG'
    
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Add country code if not present
    if (digits.length > 0 && !digits.startsWith('91')) {
      return '+91' + digits
    } else if (digits.startsWith('91')) {
      return '+' + digits
    }
    
    return digits
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return
    }
    
    if (!formData.phone) {
      setError('Please enter your phone number')
      return
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    
    const formattedPhone = formatPhoneNumber(formData.phone)
    
    try {
      await sendSignupOtp(formattedPhone)
      setCountdown(60) // Start 60 second countdown
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!otp) {
      setError('Please enter the OTP')
      return
    }
    
    if (otp.length !== 6) {
      setError('OTP must be 6 digits')
      return
    }
    
    try {
      await verifySignupOtp(
        formData.name.trim(),
        formData.email.trim(),
        otpPhone!,
        otp,
        formData.role
      )
      navigate('/')
    } catch (error: any) {
      setError(error.message || 'Invalid OTP')
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setError('')
    try {
      await resendOtp(otpPhone!, 'SIGNUP')
      setCountdown(60)
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP')
    }
  }

  const handleBack = () => {
    clearOtpState()
    setOtp('')
    setError('')
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
                {otpSent ? 'Verify OTP' : 'Create Account'}
              </h1>
              <p className="text-gray-600">
                {otpSent 
                  ? `Enter the 6-digit code sent to ${otpPhone}`
                  : 'Join BookMyPG to find your perfect accommodation'
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="input pl-10"
                      >
                        <option value="USER">Tenant (Looking for PG)</option>
                        <option value="OWNER">Owner (List your PG)</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
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
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10 text-center text-lg tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>
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
                          Creating...
                        </div>
                      ) : (
                        'Create Account'
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
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                  Sign in
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

export default RegisterPage