import React, { useEffect } from 'react'
import { usePropertyStore } from '../../store/propertyStore'
import { PropertyCard } from './PropertyCard'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export const FeaturedProperties: React.FC = () => {
  const { featured, fetchProperties, isLoading } = usePropertyStore()

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
            <p className="text-gray-600 mt-2">
              Discover our handpicked premium PG accommodations
            </p>
          </div>
          <Link to="/properties">
            <Button variant="outline" className="hidden sm:flex items-center">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/properties">
            <Button>
              View All Properties
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}