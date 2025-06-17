import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePropertyStore } from '../store/propertyStore'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { PropertyCard } from '../components/property/PropertyCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Banknote,
  SlidersHorizontal,
  X,
  Grid3X3,
  List
} from 'lucide-react'

const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { properties, isLoading, fetchProperties, getFilteredProperties, setFilters } = usePropertyStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedState, setSelectedState] = useState(searchParams.get('stateId') || '')
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('districtId') || '')
  const [priceRange, setPriceRange] = useState('')
  const [roomType, setRoomType] = useState(searchParams.get('roomTypes') || '')
  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    document.title = 'Properties | BookMyPG'
    fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    // Apply filters from URL params
    const filters = {
      location: {
        stateId: searchParams.get('stateId') || undefined,
        districtId: searchParams.get('districtId') || undefined,
        city: searchParams.get('search') || undefined
      },
      roomTypes: searchParams.get('roomTypes') ? [searchParams.get('roomTypes') as any] : [],
      priceRange: {
        min: parseInt(searchParams.get('priceMin') || '0'),
        max: parseInt(searchParams.get('priceMax') || '50000')
      },
      amenities: []
    }
    
    setFilters(filters)
  }, [searchParams, setFilters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams()
  }

  const updateSearchParams = () => {
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
    
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedState('')
    setSelectedDistrict('')
    setPriceRange('')
    setRoomType('')
    setSearchParams(new URLSearchParams())
  }

  const filteredProperties = getFilteredProperties()
  
  // Apply text search
  const searchFilteredProperties = filteredProperties.filter(property => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      property.title.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.district.toLowerCase().includes(query) ||
      property.address.toLowerCase().includes(query) ||
      property.amenities.some(amenity => amenity.toLowerCase().includes(query))
    )
  })

  // Apply sorting
  const sortedProperties = [...searchFilteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return Math.min(a.singlePrice, a.doublePrice, a.triplePrice, a.quadPrice) - 
               Math.min(b.singlePrice, b.doublePrice, b.triplePrice, b.quadPrice)
      case 'price-high':
        return Math.min(b.singlePrice, b.doublePrice, b.triplePrice, b.quadPrice) - 
               Math.min(a.singlePrice, a.doublePrice, a.triplePrice, a.quadPrice)
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        {/* Search Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search PGs by location, name, or amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-primary-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" size="lg" className="h-12 px-6">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="h-12 px-4 md:hidden"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:w-80 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <SlidersHorizontal className="h-5 w-5 mr-2" />
                    Filters
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Room Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Users className="h-4 w-4 inline mr-1" />
                      Room Type
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: '', label: 'Any Room Type' },
                        { value: 'SINGLE', label: 'Single Sharing' },
                        { value: 'DOUBLE', label: '2 Sharing' },
                        { value: 'TRIPLE', label: '3 Sharing' },
                        { value: 'QUAD', label: '4 Sharing' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="roomType"
                            value={option.value}
                            checked={roomType === option.value}
                            onChange={(e) => setRoomType(e.target.value)}
                            className="mr-2 text-primary-600"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Banknote className="h-4 w-4 inline mr-1" />
                      Price Range
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: '', label: 'Any Price' },
                        { value: '0-5000', label: 'Under ₹5,000' },
                        { value: '5000-10000', label: '₹5,000 - ₹10,000' },
                        { value: '10000-15000', label: '₹10,000 - ₹15,000' },
                        { value: '15000-20000', label: '₹15,000 - ₹20,000' },
                        { value: '20000-50000', label: 'Above ₹20,000' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="priceRange"
                            value={option.value}
                            checked={priceRange === option.value}
                            onChange={(e) => setPriceRange(e.target.value)}
                            className="mr-2 text-primary-600"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={updateSearchParams}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Properties List */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'All Properties'}
                  </h1>
                  <p className="text-gray-600">
                    {sortedProperties.length} properties found
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  {/* Sort Options */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="hidden md:flex border border-gray-200 rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Properties Grid */}
              {sortedProperties.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {sortedProperties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search criteria or browse all properties
                  </p>
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default PropertiesPage