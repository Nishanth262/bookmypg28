import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePropertyStore } from '../store/propertyStore'
import { useAuthStore } from '../store/authStore'
import { useBookingStore } from '../store/bookingStore'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Button } from '../components/ui/button'
import { formatPrice, formatDate, calculateDurationInDays } from '../lib/utils'
import { PropertyType } from '../lib/types'
import { getStateById, getDistrictById } from '../data/locations'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { 
  MapPin, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  Phone, 
  Calendar, 
  Check,
  Wifi,
  Tv,
  Coffee,
  Utensils,
  RotateCcw,
  Lock,
  Users,
  AlertCircle,
  Home
} from 'lucide-react'

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getPropertyById, isLoading, fetchProperties } = usePropertyStore()
  const { isAuthenticated, user } = useAuthStore()
  const { createBooking } = useBookingStore()
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedRoomType, setSelectedRoomType] = useState<PropertyType | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [range, setRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined})
  const [showBookingForm, setShowBookingForm] = useState(false)
  
  const property = id ? getPropertyById(id) : undefined

  useEffect(() => {
    if (!property) {
      fetchProperties()
    }
    
    if (property) {
      document.title = `${property.title} | BookMyPG`
    }
  }, [property, fetchProperties])

  useEffect(() => {
    if (range.from) {
      setStartDate(range.from)
    }
    if (range.to) {
      setEndDate(range.to)
    }
  }, [range])

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const nextImage = () => {
    if (property) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      )
    }
  }

  const prevImage = () => {
    if (property) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      )
    }
  }

  const handleBookNow = (roomType: PropertyType) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    setSelectedRoomType(roomType)
    setShowBookingForm(true)
  }

  const handleConfirmBooking = async () => {
    if (!property || !startDate || !endDate || !user || !selectedRoomType) return
    
    try {
      const totalDays = calculateDurationInDays(startDate, endDate)
      let roomPrice = 0
      
      switch (selectedRoomType) {
        case 'SINGLE':
          roomPrice = property.singlePrice
          break
        case 'DOUBLE':
          roomPrice = property.doublePrice
          break
        case 'TRIPLE':
          roomPrice = property.triplePrice
          break
        case 'QUAD':
          roomPrice = property.quadPrice
          break
      }
      
      const totalAmount = roomPrice * totalDays
      
      await createBooking({
        propertyId: property.id,
        propertyName: property.title,
        propertyImage: property.images[0],
        userId: user.id,
        userName: user.name,
        startDate,
        endDate,
        roomType: selectedRoomType,
        totalAmount,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        paymentMethod: 'Credit Card'
      })
      
      navigate('/bookings')
    } catch (error) {
      console.error('Failed to create booking', error)
    }
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-5 w-5" />
      case 'tv':
        return <Tv className="h-5 w-5" />
      case 'food':
        return <Coffee className="h-5 w-5" />
      case 'dining':
        return <Utensils className="h-5 w-5" />
      case 'power backup':
        return <RotateCcw className="h-5 w-5" />
      case 'security':
        return <Lock className="h-5 w-5" />
      default:
        return <Check className="h-5 w-5" />
    }
  }

  const getRoomTypeLabel = (roomType: PropertyType) => {
    switch (roomType) {
      case 'SINGLE':
        return 'Single Sharing'
      case 'DOUBLE':
        return '2 Sharing'
      case 'TRIPLE':
        return '3 Sharing'
      case 'QUAD':
        return '4 Sharing'
      default:
        return roomType
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <AlertCircle className="text-error-500 h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Link to="/properties">
            <Button>Browse All Properties</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Get available room types
  const availableRooms = []
  if (property.singleRooms > 0) {
    availableRooms.push({
      type: 'SINGLE' as PropertyType,
      label: 'Single Sharing',
      count: property.singleRooms,
      price: property.singlePrice
    })
  }
  if (property.doubleRooms > 0) {
    availableRooms.push({
      type: 'DOUBLE' as PropertyType,
      label: '2 Sharing',
      count: property.doubleRooms,
      price: property.doublePrice
    })
  }
  if (property.tripleRooms > 0) {
    availableRooms.push({
      type: 'TRIPLE' as PropertyType,
      label: '3 Sharing',
      count: property.tripleRooms,
      price: property.triplePrice
    })
  }
  if (property.quadRooms > 0) {
    availableRooms.push({
      type: 'QUAD' as PropertyType,
      label: '4 Sharing',
      count: property.quadRooms,
      price: property.quadPrice
    })
  }

  const state = getStateById(property.stateId)
  const district = getDistrictById(property.districtId)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    <Link to="/properties" className="text-gray-700 hover:text-primary-600 transition-colors">
                      Properties
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-500">{property.title}</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          
          {/* Property Title & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.address}, {district?.name}, {state?.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-error-500 text-error-500' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                aria-label="Share property"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Property Gallery */}
          <div className="mb-8">
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={property.images[currentImageIndex]} 
                alt={property.title} 
                className="w-full h-96 object-cover"
              />
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {property.images.map((_, index) => (
                  <button 
                    key={index} 
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex mt-2 overflow-x-auto space-x-2 pb-2">
              {property.images.map((image, index) => (
                <button 
                  key={index} 
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 rounded-md overflow-hidden ${
                    index === currentImageIndex ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${property.title} - view ${index + 1}`} 
                    className="w-20 h-16 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Property Details */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-accent-500 fill-current" />
                    <span className="font-semibold ml-1">{property.rating}</span>
                    <span className="text-gray-500 text-sm ml-1">({property.reviewCount} reviews)</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{property.description}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Available Room Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableRooms.map((room) => (
                      <div key={room.type} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-700 mr-2" />
                            <span className="font-semibold">{room.label}</span>
                          </div>
                          <span className="text-sm text-gray-500">{room.count} available</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-primary-600">
                            {formatPrice(room.price)}/month
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handleBookNow(room.type)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          {getAmenityIcon(amenity)}
                        </div>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Owner</h3>
                  <div className="flex items-center">
                    {property.ownerAvatar ? (
                      <img 
                        src={property.ownerAvatar} 
                        alt={property.ownerName} 
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                        <span className="text-gray-600 font-semibold">
                          {property.ownerName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{property.ownerName}</p>
                      <p className="text-gray-500 text-sm">Property Owner</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Location</h2>
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-500 ml-2">Map view placeholder</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Address</h3>
                  <p className="text-gray-700">
                    {property.address}, {district?.name}, {state?.name} - {property.pincode}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Booking Card */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-20">
                {!showBookingForm ? (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Room Options</h3>
                    <div className="space-y-4">
                      {availableRooms.map((room) => (
                        <div key={room.type} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{room.label}</span>
                            <span className="text-sm text-gray-500">{room.count} available</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary-600">
                              {formatPrice(room.price)}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleBookNow(room.type)}
                            >
                              Book
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Refundable Deposit</span>
                        <span className="font-semibold">{formatPrice(property.deposit)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Book Room</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowBookingForm(false)}
                      >
                        Back
                      </Button>
                    </div>
                    
                    {selectedRoomType && (
                      <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{getRoomTypeLabel(selectedRoomType)}</span>
                          <span className="text-lg font-bold text-primary-600">
                            {formatPrice(
                              selectedRoomType === 'SINGLE' ? property.singlePrice :
                              selectedRoomType === 'DOUBLE' ? property.doublePrice :
                              selectedRoomType === 'TRIPLE' ? property.triplePrice :
                              property.quadPrice
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Select Dates
                    </h4>
                    
                    <div className="border border-gray-200 rounded-lg p-2 mb-4">
                      <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={(range: any) => setRange(range)}
                        styles={{
                          caption: { color: '#6d28d9' },
                          button: { margin: '0 auto' },
                        }}
                      />
                    </div>
                    
                    {startDate && endDate && selectedRoomType && (
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Check-in</span>
                          <span className="font-semibold">{formatDate(startDate)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Check-out</span>
                          <span className="font-semibold">{formatDate(endDate)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-semibold">
                            {calculateDurationInDays(startDate, endDate)} days
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-100">
                          <span>Total</span>
                          <span>
                            {formatPrice(
                              (selectedRoomType === 'SINGLE' ? property.singlePrice :
                               selectedRoomType === 'DOUBLE' ? property.doublePrice :
                               selectedRoomType === 'TRIPLE' ? property.triplePrice :
                               property.quadPrice) * calculateDurationInDays(startDate, endDate)
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full"
                      onClick={handleConfirmBooking}
                      disabled={!startDate || !endDate || !selectedRoomType}
                    >
                      Confirm Booking
                    </Button>
                  </div>
                )}
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <p className="mb-2">No charges until booking is confirmed</p>
                  <div className="flex justify-center space-x-4">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span>Free cancellation</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span>Secure payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default PropertyDetailsPage