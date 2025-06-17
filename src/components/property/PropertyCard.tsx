import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Property } from '../../lib/types'
import { formatPrice } from '../../lib/utils'
import { Card, CardContent, CardFooter } from '../ui/card'
import { MapPin, Star, Wifi, Tv, Coffee, Users, Home } from 'lucide-react'

interface PropertyCardProps {
  property: Property
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const {
    id,
    title,
    city,
    district,
    state,
    images,
    rating,
    reviewCount,
    amenities,
    singleRooms,
    doubleRooms,
    tripleRooms,
    quadRooms,
    singlePrice,
    doublePrice,
    triplePrice,
    quadPrice,
  } = property

  // Function to get appropriate icon for an amenity
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-3 w-3" />
      case 'tv':
        return <Tv className="h-3 w-3" />
      case 'food':
        return <Coffee className="h-3 w-3" />
      default:
        return null
    }
  }

  // Get available room types and their prices
  const availableRooms = []
  if (singleRooms > 0) availableRooms.push({ type: 'Single', count: singleRooms, price: singlePrice })
  if (doubleRooms > 0) availableRooms.push({ type: '2 Sharing', count: doubleRooms, price: doublePrice })
  if (tripleRooms > 0) availableRooms.push({ type: '3 Sharing', count: tripleRooms, price: triplePrice })
  if (quadRooms > 0) availableRooms.push({ type: '4 Sharing', count: quadRooms, price: quadPrice })

  // Get the lowest price for display
  const lowestPrice = Math.min(
    ...[singlePrice, doublePrice, triplePrice, quadPrice].filter(price => price > 0)
  )

  // Take only first 3 amenities
  const displayAmenities = amenities.slice(0, 3)

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/property/${id}`}>
        <Card className="overflow-hidden h-full">
          <div className="relative overflow-hidden h-48">
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
            <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded">
              {availableRooms.length} Room Types
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
              <div className="flex items-center space-x-1 text-accent-500">
                <Star className="fill-current h-4 w-4" />
                <span className="text-sm font-medium">{rating}</span>
                <span className="text-xs text-gray-500">({reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center mt-2 text-gray-500 text-sm mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{district}, {state}</span>
            </div>

            {/* Available Room Types */}
            <div className="mb-3">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Home className="h-4 w-4 mr-1" />
                <span>Available Rooms:</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {availableRooms.slice(0, 4).map((room, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {room.type}
                    </span>
                    <span className="font-medium">{room.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(lowestPrice)}
              </span>
              <span className="text-gray-500 text-sm">/month onwards</span>
            </div>
          </CardContent>

          <CardFooter className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {displayAmenities.map((amenity, index) => (
                <div 
                  key={index} 
                  className="badge badge-primary flex items-center space-x-1"
                >
                  {getAmenityIcon(amenity)}
                  <span>{amenity}</span>
                </div>
              ))}
              {amenities.length > 3 && (
                <div className="badge badge-secondary">
                  +{amenities.length - 3}
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}