// Haversine formula to calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

// Approximate coordinates for Bangalore areas (for demo purposes)
export const BANGALORE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'koramangala': { lat: 12.9279, lng: 77.6271 },
  'hsr layout': { lat: 12.9116, lng: 77.6473 },
  'indiranagar': { lat: 12.9719, lng: 77.6412 },
  'btm layout': { lat: 12.9165, lng: 77.6101 },
  'whitefield': { lat: 12.9698, lng: 77.7500 },
  'electronic city': { lat: 12.8456, lng: 77.6603 },
  'marathahalli': { lat: 12.9591, lng: 77.6974 },
  'jayanagar': { lat: 12.9237, lng: 77.5838 },
  'rajajinagar': { lat: 12.9915, lng: 77.5553 },
  'malleshwaram': { lat: 12.9941, lng: 77.5750 },
  'yelahanka': { lat: 13.1007, lng: 77.5963 },
  'hebbal': { lat: 13.0358, lng: 77.5970 },
  'sarjapur': { lat: 12.8988, lng: 77.6890 },
  'bellandur': { lat: 12.9258, lng: 77.6815 },
  'bommanahalli': { lat: 12.9067, lng: 77.6162 }
}

export const getCoordinatesForArea = (area: string): { lat: number; lng: number } | null => {
  const normalizedArea = area.toLowerCase().trim()
  return BANGALORE_COORDINATES[normalizedArea] || null
}

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`
  }
  return `${distance}km away`
}

// Reverse geocoding simulation (in real app, use Google Maps API or similar)
export const getAreaFromCoordinates = (lat: number, lng: number): string => {
  let closestArea = 'Unknown Area'
  let minDistance = Infinity

  Object.entries(BANGALORE_COORDINATES).forEach(([area, coords]) => {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng)
    if (distance < minDistance) {
      minDistance = distance
      closestArea = area.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
  })

  return closestArea
}