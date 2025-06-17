import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PropertyType } from '../../lib/types'
import { INDIAN_STATES, getDistrictsByStateId } from '../../data/locations'
import { 
  Search, 
  MapPin, 
  Users, 
  Banknote,
  Filter,
  X
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export const PropertySearch: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [roomType, setRoomType] = useState('')

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    const params = new URLSearchParams()
    params.append('search', searchQuery.trim())
    
    navigate({
      pathname: '/properties',
      search: params.toString()
    })
  }

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    
    if (searchQuery.trim()) params.append('search', searchQuery.trim())
    if (selectedState) params.append('stateId', selectedState)
    if (selectedDistrict) params.append('districtId', selectedDistrict)
    if (roomType) params.append('roomTypes', roomType)
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(p => p.trim())
      if (min) params.append('priceMin', min)
      if (max) params.append('priceMax', max)
    }
    
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
              type="text"
              placeholder="Search by city, area, or PG name (e.g., Koramangala, HSR Layout)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-primary-500 rounded-lg"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              size="lg"
              className="h-12 px-8 bg-primary-600 hover:bg-primary-700"
            >
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