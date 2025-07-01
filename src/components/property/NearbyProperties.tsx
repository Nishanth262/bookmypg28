import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGeolocation } from '../../hooks/useGeolocation'
import { usePropertyStore } from '../../store/propertyStore'
import { PropertyCard } from './PropertyCard'
import { Button } from '../ui/button'
import { 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react'
import { calculateDistance, getCoordinatesForArea, formatDistance, getAreaFromCoordinates } from '../../utils/locationUtils'
import { Property } from '../../lib/types'

interface PropertyWithDistance extends Property {
  distance: number
}

export const NearbyProperties: React.FC = () => {
  const { latitude, longitude, error, loading, getCurrentLocation } = useGeolocation()
  const { properties, fetchProperties } = usePropertyStore()
  const [nearbyProperties, setNearbyProperties] = useState<PropertyWithDistance[]>([])
  const [userArea, setUserArea] = useState<string>('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    if (latitude && longitude) {
      // Get user's area
      const area = getAreaFromCoordinates(latitude, longitude)
      setUserArea(area)

      // Calculate distances to all properties
      const propertiesWithDistance: PropertyWithDistance[] = properties
        .map(property => {
          const propertyCoords = getCoordinatesForArea(property.city.toLowerCase())
          if (!propertyCoords) {
            // If we don't have coordinates for the area, use a default distance
            return { ...property, distance: 999 }
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            propertyCoords.lat,
            propertyCoords.lng
          )

          return { ...property, distance }
        })
        .filter(property => property.distance < 50) // Within 50km
        .sort((a, b) => a.distance - b.distance)

      setNearbyProperties(propertiesWithDistance)
    }
  }, [latitude, longitude, properties])

  const displayedProperties = showAll ? nearbyProperties : nearbyProperties.slice(0, 6)

  if (error) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-warning-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Access Required</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error}. Enable location access to see PGs near you.
            </p>
            <Button onClick={getCurrentLocation} className="mb-4">
              <Navigation className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
            <p className="text-sm text-gray-500">
              We use your location only to show nearby properties
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!latitude || !longitude) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Navigation className="h-12 w-12 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Find PGs Near You</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Allow location access to discover the best PG accommodations in your area
            </p>
            <Button onClick={getCurrentLocation} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Find Nearby PGs
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Your location data is used only to show relevant properties and is not stored
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">PGs Near You</h2>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Your location: {userArea}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={getCurrentLocation}
                className="ml-2"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {nearbyProperties.length} properties found within 50km
            </p>
          </div>
        </div>

        {nearbyProperties.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No nearby properties found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any PG accommodations in your area. Try expanding your search radius.
            </p>
            <Button onClick={() => window.location.href = '/properties'}>
              Browse All Properties
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative"
                >
                  <PropertyCard property={property} />
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <Navigation className="h-3 w-3 mr-1" />
                    {formatDistance(property.distance)}
                  </div>
                </motion.div>
              ))}
            </div>

            {nearbyProperties.length > 6 && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="px-8"
                >
                  {showAll ? 'Show Less' : `Show All ${nearbyProperties.length} Properties`}
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Location-based recommendations</p>
              <p>
                Properties are sorted by distance from your current location. 
                Distances are approximate and calculated in straight lines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}