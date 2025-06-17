import { create } from 'zustand'
import { Property, PropertyType, LocationFilter } from '../lib/types'
import { getStateById, getDistrictById } from '../data/locations'

interface PropertyState {
  properties: Property[]
  featured: Property[]
  isLoading: boolean
  error: string | null
  filters: {
    location: LocationFilter
    priceRange: {
      min: number
      max: number
    }
    roomTypes: PropertyType[]
    amenities: string[]
  }
  fetchProperties: () => Promise<void>
  setFilters: (filters: Partial<PropertyState['filters']>) => void
  getPropertyById: (id: string) => Property | undefined
  getFilteredProperties: () => Property[]
}

// Enhanced mock properties data with multiple room types
const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern PG with Multiple Room Options',
    description: 'A modern, well-ventilated PG accommodation with various room sharing options. Includes all utilities and high-speed WiFi. Close to major tech parks.',
    address: '123 Koramangala Main Road',
    city: 'Bangalore',
    state: 'Karnataka',
    stateId: 'karnataka',
    district: 'Bengaluru Urban',
    districtId: 'bengaluru-urban',
    pincode: '560034',
    
    // Room availability
    singleRooms: 5,
    doubleRooms: 8,
    tripleRooms: 4,
    quadRooms: 2,
    
    // Room pricing
    singlePrice: 15000,
    doublePrice: 10000,
    triplePrice: 8000,
    quadPrice: 6500,
    
    deposit: 20000,
    amenities: ['WiFi', 'AC', 'TV', 'Washing Machine', 'Kitchen', 'Power Backup', 'Housekeeping'],
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    
    // Legacy fields
    type: 'SINGLE',
    capacity: 1,
    price: 15000,
    
    rating: 4.8,
    reviewCount: 24,
    ownerId: '2',
    ownerName: 'Jane Smith',
    ownerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    available: true,
    featured: true,
    createdAt: new Date('2023-10-15')
  },
  {
    id: '2',
    title: 'Budget Friendly PG in HSR Layout',
    description: 'Affordable accommodation with multiple sharing options. Perfect for students and working professionals.',
    address: '45 HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    stateId: 'karnataka',
    district: 'Bengaluru Urban',
    districtId: 'bengaluru-urban',
    pincode: '560102',
    
    // Room availability
    singleRooms: 2,
    doubleRooms: 10,
    tripleRooms: 8,
    quadRooms: 5,
    
    // Room pricing
    singlePrice: 12000,
    doublePrice: 8500,
    triplePrice: 7000,
    quadPrice: 5500,
    
    deposit: 15000,
    amenities: ['WiFi', 'Gym', 'Dining', 'Laundry', 'CCTV', 'Security'],
    images: [
      'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    
    // Legacy fields
    type: 'DOUBLE',
    capacity: 2,
    price: 8500,
    
    rating: 4.5,
    reviewCount: 18,
    ownerId: '2',
    ownerName: 'Jane Smith',
    ownerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    available: true,
    featured: false,
    createdAt: new Date('2023-11-05')
  },
  {
    id: '3',
    title: 'Premium PG in Indiranagar',
    description: 'Luxurious accommodation with premium amenities. Multiple room options available.',
    address: '78 Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    stateId: 'karnataka',
    district: 'Bengaluru Urban',
    districtId: 'bengaluru-urban',
    pincode: '560038',
    
    // Room availability
    singleRooms: 8,
    doubleRooms: 6,
    tripleRooms: 3,
    quadRooms: 1,
    
    // Room pricing
    singlePrice: 18000,
    doublePrice: 13000,
    triplePrice: 10000,
    quadPrice: 8000,
    
    deposit: 30000,
    amenities: ['WiFi', 'AC', 'TV', 'Attached Bathroom', 'Housekeeping', 'Food', 'Gym'],
    images: [
      'https://images.pexels.com/photos/1648768/pexels-photo-1648768.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/6969866/pexels-photo-6969866.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    
    // Legacy fields
    type: 'SINGLE',
    capacity: 1,
    price: 18000,
    
    rating: 4.9,
    reviewCount: 32,
    ownerId: '2',
    ownerName: 'Jane Smith',
    ownerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    available: true,
    featured: true,
    createdAt: new Date('2023-09-20')
  },
  {
    id: '4',
    title: 'Student PG in BTM Layout',
    description: 'Affordable accommodation designed for students. Multiple sharing options available.',
    address: '34  BTM Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    stateId: 'karnataka',
    district: 'Bengaluru Urban',
    districtId: 'bengaluru-urban',
    pincode: '560076',
    
    // Room availability
    singleRooms: 1,
    doubleRooms: 5,
    tripleRooms: 10,
    quadRooms: 8,
    
    // Room pricing
    singlePrice: 10000,
    doublePrice: 7000,
    triplePrice: 5500,
    quadPrice: 4500,
    
    deposit: 10000,
    amenities: ['WiFi', 'Common TV', 'Food', 'Water Purifier', 'Study Room'],
    images: [
      'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    
    // Legacy fields
    type: 'TRIPLE',
    capacity: 3,
    price: 5500,
    
    rating: 4.0,
    reviewCount: 12,
    ownerId: '2',
    ownerName: 'Jane Smith',
    ownerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    available: true,
    featured: false,
    createdAt: new Date('2023-12-10')
  },
  {
    id: '5',
    title: 'Executive PG in Whitefield',
    description: 'Premium accommodation for working professionals with various room configurations.',
    address: '56 Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    stateId: 'karnataka',
    district: 'Bengaluru Urban',
    districtId: 'bengaluru-urban',
    pincode: '560066',
    
    // Room availability
    singleRooms: 12,
    doubleRooms: 8,
    tripleRooms: 4,
    quadRooms: 2,
    
    // Room pricing
    singlePrice: 16000,
    doublePrice: 11000,
    triplePrice: 9000,
    quadPrice: 7500,
    
    deposit: 25000,
    amenities: ['WiFi', 'AC', 'TV', 'Washing Machine', 'Gym', 'Food', 'Power Backup'],
    images: [
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/3773581/pexels-photo-3773581.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    
    // Legacy fields
    type: 'SINGLE',
    capacity: 1,
    price: 16000,
    
    rating: 4.7,
    reviewCount: 28,
    ownerId: '2',
    ownerName: 'Jane Smith',
    ownerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    available: true,
    featured: true,
    createdAt: new Date('2023-08-15')
  },
  {
    id: '6',
    title: 'Co-living Space in Electronic City',
    description: 'Modern co-living space with shared facilities and multiple room options.',
    address: '90 Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    stateId: 'karnataka',
    district: 'Bengaluru Urban',
    districtId: 'bengaluru-urban',
    pincode: '560100',
    
    // Room availability
    singleRooms: 6,
    doubleRooms: 12,
    tripleRooms: 8,
    quadRooms: 6,
    
    // Room pricing
    singlePrice: 14000,
    doublePrice: 9500,
    triplePrice: 7500,
    quadPrice: 6000,
    
    deposit: 18000,
    amenities: ['WiFi', 'Common Kitchen', 'Recreation Room', 'Laundry', 'Housekeeping', 'Security'],
    images: [
      'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/3144580/pexels-photo-3144580.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    
    // Legacy fields
    type: 'QUAD',
    capacity: 4,
    price: 6000,
    
    rating: 4.4,
    reviewCount: 22,
    ownerId: '2',
    ownerName: 'Jane Smith',
    ownerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    available: true,
    featured: false,
    createdAt: new Date('2023-10-30')
  }
]

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  featured: [],
  isLoading: false,
  error: null,
  filters: {
    location: {},
    priceRange: {
      min: 0,
      max: 50000
    },
    roomTypes: [],
    amenities: []
  },
  
  fetchProperties: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      set({ 
        properties: mockProperties,
        featured: mockProperties.filter(p => p.featured),
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: 'Failed to fetch properties', 
        isLoading: false 
      })
    }
  },
  
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } })
  },
  
  getPropertyById: (id) => {
    return get().properties.find(p => p.id === id)
  },
  
  getFilteredProperties: () => {
    const { properties, filters } = get()
    
    return properties.filter(property => {
      // Location filter
      if (filters.location.stateId && property.stateId !== filters.location.stateId) {
        return false
      }
      
      if (filters.location.districtId && property.districtId !== filters.location.districtId) {
        return false
      }
      
      if (filters.location.city && !property.city.toLowerCase().includes(filters.location.city.toLowerCase())) {
        return false
      }
      
      // Room type filter
      if (filters.roomTypes.length > 0) {
        const hasRequestedRoomType = filters.roomTypes.some(roomType => {
          switch (roomType) {
            case 'SINGLE':
              return property.singleRooms > 0
            case 'DOUBLE':
              return property.doubleRooms > 0
            case 'TRIPLE':
              return property.tripleRooms > 0
            case 'QUAD':
              return property.quadRooms > 0
            default:
              return false
          }
        })
        
        if (!hasRequestedRoomType) {
          return false
        }
      }
      
      // Price range filter (check if any room type falls within range)
      const prices = [
        property.singlePrice,
        property.doublePrice,
        property.triplePrice,
        property.quadPrice
      ].filter(price => price > 0)
      
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      if (minPrice > filters.priceRange.max || maxPrice < filters.priceRange.min) {
        return false
      }
      
      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity =>
          property.amenities.some(propAmenity =>
            propAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
        
        if (!hasAllAmenities) {
          return false
        }
      }
      
      return true
    })
  }
}))