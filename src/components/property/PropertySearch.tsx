import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PropertyType } from '../../lib/types'
import { INDIAN_STATES, getDistrictsByStateId } from '../../data/locations'
import { usePropertyStore } from '../../store/propertyStore'
import { 
  Search, 
  MapPin, 
  Users, 
  Banknote,
  Filter,
  X,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface SearchSuggestion {
  id: string
  type: 'location' | 'property' | 'amenity' | 'recent'
  title: string
  subtitle?: string
  icon: React.ReactNode
}

export const PropertySearch: React.FC = () => {
  const navigate = useNavigate()
  const { properties } = usePropertyStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [roomType, setRoomType] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Generate suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show recent searches and popular suggestions when no query
      const recentSuggestions: SearchSuggestion[] = recentSearches.slice(0, 3).map((search, index) => ({
        id: `recent-${index}`,
        type: 'recent',
        title: search,
        icon: <Clock className="h-4 w-4" />
      }))

      const popularSuggestions: SearchSuggestion[] = [
        {
          id: 'popular-1',
          type: 'location',
          title: 'Koramangala',
          subtitle: 'Bangalore, Karnataka',
          icon: <MapPin className="h-4 w-4" />
        },
        {
          id: 'popular-2',
          type: 'location',
          title: 'HSR Layout',
          subtitle: 'Bangalore, Karnataka',
          icon: <MapPin className="h-4 w-4" />
        },
        {
          id: 'popular-3',
          type: 'amenity',
          title: 'WiFi',
          subtitle: 'Properties with WiFi',
          icon: <TrendingUp className="h-4 w-4" />
        },
        {
          id: 'popular-4',
          type: 'amenity',
          title: 'Single Sharing',
          subtitle: 'Single occupancy rooms',
          icon: <Users className="h-4 w-4" />
        }
      ]

      setSuggestions([...recentSuggestions, ...popularSuggestions])
      return
    }

    const query = searchQuery.toLowerCase()
    const newSuggestions: SearchSuggestion[] = []

    // Location suggestions (cities, areas)
    const locationSuggestions = [
      'Koramangala', 'HSR Layout', 'Indiranagar', 'BTM Layout', 'Whitefield', 
      'Electronic City', 'Marathahalli', 'Jayanagar', 'Rajajinagar', 'Malleshwaram',
      'Yelahanka', 'Hebbal', 'Sarjapur', 'Bellandur', 'Bommanahalli'
    ].filter(location => location.toLowerCase().includes(query))
     .slice(0, 4)
     .map(location => ({
       id: `location-${location}`,
       type: 'location' as const,
       title: location,
       subtitle: 'Bangalore, Karnataka',
       icon: <MapPin className="h-4 w-4" />
     }))

    newSuggestions.push(...locationSuggestions)

    // Property name suggestions
    const propertySuggestions = properties
      .filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map(property => ({
        id: `property-${property.id}`,
        type: 'property' as const,
        title: property.title,
        subtitle: `${property.city}, ${property.state}`,
        icon: <MapPin className="h-4 w-4" />
      }))

    newSuggestions.push(...propertySuggestions)

    // Amenity suggestions
    const amenitySuggestions = [
      'WiFi', 'AC', 'TV', 'Gym', 'Food', 'Laundry', 'Parking', 'Security',
      'Power Backup', 'Housekeeping', 'Kitchen', 'Washing Machine'
    ].filter(amenity => amenity.toLowerCase().includes(query))
     .slice(0, 3)
     .map(amenity => ({
       id: `amenity-${amenity}`,
       type: 'amenity' as const,
       title: amenity,
       subtitle: `Properties with ${amenity}`,
       icon: <TrendingUp className="h-4 w-4" />
     }))

    newSuggestions.push(...amenitySuggestions)

    // Room type suggestions
    const roomTypeSuggestions = [
      { key: 'single', label: 'Single Sharing', value: 'SINGLE' },
      { key: 'double', label: '2 Sharing', value: 'DOUBLE' },
      { key: 'triple', label: '3 Sharing', value: 'TRIPLE' },
      { key: 'quad', label: '4 Sharing', value: 'QUAD' }
    ].filter(room => 
      room.label.toLowerCase().includes(query) || 
      room.key.includes(query)
    ).slice(0, 2)
     .map(room => ({
       id: `room-${room.key}`,
       type: 'amenity' as const,
       title: room.label,
       subtitle: 'Room type',
       icon: <Users className="h-4 w-4" />
     }))

    newSuggestions.push(...roomTypeSuggestions)

    setSuggestions(newSuggestions.slice(0, 8))
  }, [searchQuery, properties, recentSearches])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    saveRecentSearch(searchQuery.trim())
    setShowSuggestions(false)
    
    const params = new URLSearchParams()
    params.append('search', searchQuery.trim())
    
    navigate({
      pathname: '/properties',
      search: params.toString()
    })
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title)
    setShowSuggestions(false)
    saveRecentSearch(suggestion.title)
    
    const params = new URLSearchParams()
    
    if (suggestion.type === 'property') {
      // Navigate directly to property
      const property = properties.find(p => p.title === suggestion.title)
      if (property) {
        navigate(`/property/${property.id}`)
        return
      }
    }
    
    params.append('search', suggestion.title)
    
    navigate({
      pathname: '/properties',
      search: params.toString()
    })
  }

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim())
      saveRecentSearch(searchQuery.trim())
    }
    if (selectedState) params.append('stateId', selectedState)
    if (selectedDistrict) params.append('districtId', selectedDistrict)
    if (roomType) params.append('roomTypes', roomType)
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(p => p.trim())
      if (min) params.append('priceMin', min)
      if (max) params.append('priceMax', max)
    }
    
    setShowSuggestions(false)
    navigate({
      pathname: '/properties',
      search: params.toString()
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedState('')
    setSelectedDistrict('')
    setPriceRange('')
    setRoomType('')
    setShowAdvanced(false)
    setShowSuggestions(false)
  }

  const availableDistricts = selectedState ? getDistrictsByStateId(selectedState) : []

  const priceRanges = [
    { value: '0-5000', label: 'Under ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-15000', label: '₹10,000 - ₹15,000' },
    { value: '15000-20000', label: '₹15,000 - ₹20,000' },
    { value: '20000-50000', label: 'Above ₹20,000' }
  ]

  const roomTypes = [
    { value: 'SINGLE', label: 'Single Sharing' },
    { value: 'DOUBLE', label: '2 Sharing' },
    { value: 'TRIPLE', label: '3 Sharing' },
    { value: 'QUAD', label: '4 Sharing' }
  ]

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 -mt-16 relative z-10 mx-4 lg:mx-auto max-w-4xl">
      {/* Quick Search */}
      <form onSubmit={handleQuickSearch} className="mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by city, area, or PG name (e.g., Koramangala, HSR Layout)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-primary-500 rounded-lg"
              autoComplete="off"
            />
            
            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  ref={suggestionsRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                >
                  {!searchQuery.trim() && recentSearches.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Recent Searches
                        </span>
                        <button
                          onClick={() => {
                            setRecentSearches([])
                            localStorage.removeItem('recentSearches')
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <div className="text-gray-400">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.title}
                        </div>
                        {suggestion.subtitle && (
                          <div className="text-xs text-gray-500 truncate">
                            {suggestion.subtitle}
                          </div>
                        )}
                      </div>
                      {suggestion.type === 'recent' && (
                        <div className="text-xs text-gray-400">
                          Recent
                        </div>
                      )}
                    </motion.button>
                  ))}
                  
                  {!searchQuery.trim() && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Popular searches and recent activity
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" size="lg" className="h-12 px-8 bg-primary-600 hover:bg-primary-700">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-12 px-4 border-2"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </form>

      {/* Advanced Filters */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 pt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <form onSubmit={handleAdvancedSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary-500" />
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value)
                    setSelectedDistrict('')
                  }}
                  className="input h-10"
                >
                  <option value="">All States</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary-500" />
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="input h-10"
                  disabled={!selectedState}
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-primary-500" />
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="input h-10"
                >
                  <option value="">Any Room Type</option>
                  {roomTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Banknote className="h-4 w-4 mr-1 text-primary-500" />
                  Price Range
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="input h-10"
                >
                  <option value="">Any Price</option>
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg"
                className="px-8 bg-primary-600 hover:bg-primary-700"
              >
                <Search className="h-5 w-5 mr-2" />
                Search with Filters
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Quick Search Suggestions */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-2">Popular searches:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Koramangala PG',
            'HSR Layout',
            'Indiranagar',
            'BTM Layout',
            'Whitefield',
            'Electronic City',
            'Single Sharing',
            'Under ₹10,000'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setSearchQuery(suggestion)
                setShowSuggestions(false)
                const params = new URLSearchParams()
                params.append('search', suggestion)
                navigate({
                  pathname: '/properties',
                  search: params.toString()
                })
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}