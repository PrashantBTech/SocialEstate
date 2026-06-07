import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getListings } from '@/api/listingApi'
import PropertyCard from '@/components/common/PropertyCard'
import Pagination from '@/components/common/Pagination'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import toast from 'react-hot-toast'

const PROPERTY_TYPES = [
  { value: '', label: 'All Categories' },
  { value: 'plot', label: 'Plots & Land' },
  { value: 'flat', label: 'Flats & Apartments' },
  { value: 'house', label: 'Independent Houses' },
  { value: 'builder_floor', label: 'Builder Floors' },
  { value: '1rk', label: '1RK / Studio' },
  { value: 'shop', label: 'Commercial Spaces' },
]

const SORT_OPTIONS = [
  { value: '-propertyScore', label: 'Best Match' },
  { value: '-createdAt',     label: 'Date Published' },
  { value: 'askingPrice',    label: 'Price: Low to High' },
  { value: '-askingPrice',   label: 'Price: High to Low' },
]

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai']

export default function ListingFeed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Geolocation state
  const [userLocation, setUserLocation] = useState(null) // { lat, lng, label }

  const sortParam = searchParams.get('sort')
  const defaultSort = userLocation ? 'nearest' : '-createdAt'
  const currentSort = sortParam || defaultSort

  const filters = {
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    intent: searchParams.get('listingType') === 'sale' ? 'sell' : (searchParams.get('listingType') === 'rent' ? 'rent' : ''),
    budgetMin: searchParams.get('budgetMin') || '',
    budgetMax: searchParams.get('budgetMax') || '',
    bhk: searchParams.get('bhk') || '',
    sort: currentSort,
    status: 'active',
    page,
    limit: 12,
  }

  // Build API params — inject lat/lng when sorting by nearest
  const apiParams = { ...filters }
  if (currentSort === 'nearest' && userLocation) {
    apiParams.lat = userLocation.lat
    apiParams.lng = userLocation.lng
    delete apiParams.sort // backend sorts by distance when lat/lng present
  }

  const { data, isLoading } = useQuery({
    queryKey: ['listings', apiParams],
    queryFn: () => getListings(apiParams),
    select: d => d.data.data,
    keepPreviousData: true,
  })

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    setSearchParams(p)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchParams({})
    setPage(1)
  }
  const hasFilters = [...searchParams.keys()].filter(k => k !== 'status').length > 0

  // Reverse geocode to get a human-readable location name
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      })
      const data = await res.json()
      const addr = data.address
      return addr?.city || addr?.town || addr?.village || addr?.suburb || addr?.county || 'Your Location'
    } catch {
      return 'Your Location'
    }
  }, [])

  // Auto-request location on component mount
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const label = await reverseGeocode(latitude, longitude)
          setUserLocation({ lat: latitude, lng: longitude, label })
        },
        () => {
          // Silently fail if user denies or ignores the location prompt
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      )
    }
  }, [reverseGeocode, userLocation])

  // Explicit location request if they click "Nearest First" but we don't have it yet
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const label = await reverseGeocode(latitude, longitude)
        setUserLocation({ lat: latitude, lng: longitude, label })
        setFilter('sort', 'nearest')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please enable it in browser settings.')
        } else {
          toast.error('Unable to get your location.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }

  // Sort change handler
  const handleSortChange = (value) => {
    if (value === 'nearest' && !userLocation) {
      handleGetLocation()
    } else {
      setFilter('sort', value)
    }
  }

  return (
    <>
      <Helmet>
        <title>{filters.city ? `Properties in ${filters.city}` : 'Buy Property in India'} | SocialEstate</title>
        <meta name="description" content="Discover a vast range of properties available to buy, sell, and rent across India. Our platform features verified listings of houses, apartments, commercial properties, and more." />
      </Helmet>

      <div className="pt-20 min-h-screen bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Location Banner Removed */}

          {/* Top SEO Description */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-none">
              Discover a vast range of properties available to buy, sell, and rent across India on SocialEstate. Our platform features verified listings of houses, apartments, commercial properties, and more. Whether you're looking to invest in real estate or find your dream home, we have you covered.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Mobile Filters Toggle */}
            <div className="md:hidden flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <span className="font-medium text-navy-900">Filters & Categories</span>
              <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} className="p-2 bg-navy-50 text-navy-600 rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>

            {/* Sidebar (Categories, Locations, Filters) */}
            <aside className={`w-full md:w-64 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden'} md:block`}>
              
              {/* Intent (Buy / Rent) */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-navy-900 text-sm tracking-wide uppercase">Property Purpose</h3>
                </div>
                <div className="p-2 flex gap-2">
                  <button 
                    onClick={() => setFilter('listingType', searchParams.get('listingType') === 'sale' ? '' : 'sale')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchParams.get('listingType') === 'sale' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setFilter('listingType', searchParams.get('listingType') === 'rent' ? '' : 'rent')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchParams.get('listingType') === 'rent' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Rent
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-navy-900 text-sm tracking-wide uppercase">Categories</h3>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
                <div className="p-2">
                  {PROPERTY_TYPES.map(t => (
                    <button 
                      key={t.value}
                      onClick={() => setFilter('propertyType', t.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filters.propertyType === t.value ? 'bg-navy-50 text-navy-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-navy-900 text-sm tracking-wide uppercase">Locations</h3>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <input 
                      type="text" 
                      placeholder="Search city..." 
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                      value={filters.city}
                      onChange={e => setFilter('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Popular Cities</p>
                    {POPULAR_CITIES.map(city => (
                      <button 
                        key={city}
                        onClick={() => setFilter('city', filters.city === city ? '' : city)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${filters.city === city ? 'bg-navy-50 text-navy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-navy-900 text-sm tracking-wide uppercase">Budget</h3>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min Price (₹)</label>
                    <input type="number" placeholder="e.g. 10000" value={filters.budgetMin}
                      onChange={e => setFilter('budgetMin', e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max Price (₹)</label>
                    <input type="number" placeholder="e.g. 5000000" value={filters.budgetMax}
                      onChange={e => setFilter('budgetMax', e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-500" />
                  </div>
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="w-full bg-white border border-gray-200 text-navy-600 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm">
                  Clear All Filters
                </button>
              )}
            </aside>

            {/* Main Listing Area */}
            <main className="flex-1 min-w-0">
              
              {/* Header: Title, Count, Sort */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-2 border-b border-gray-200 gap-4">
                <div>
                  <h1 className="text-lg font-medium text-navy-900">
                    {data?.pagination?.total ? data.pagination.total.toLocaleString() : 0} ads in {filters.city || 'India'}
                    {currentSort === 'nearest' && userLocation && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full align-middle">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        Near {userLocation.label}
                      </span>
                    )}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium uppercase tracking-wide">Sort By :</span>
                  <select 
                    value={currentSort} 
                    onChange={e => handleSortChange(e.target.value)} 
                    className="border-none bg-transparent font-semibold text-navy-900 text-sm focus:ring-0 cursor-pointer"
                  >
                    <option value="nearest">Nearest First</option>
                    {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Grid */}
              {isLoading ? (
                <LoadingSpinner size="lg" text={currentSort === 'nearest' ? "Finding nearby properties..." : "Finding properties for you..."} />
              ) : data?.listings?.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.listings.map(l => <PropertyCard key={l._id} listing={l} />)}
                  </div>
                  <div className="mt-8">
                    <Pagination page={page} total={data.pagination.total} limit={12} onPageChange={setPage} />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}
                  title={currentSort === 'nearest' ? "No nearby properties found" : "No properties found"}
                  description={currentSort === 'nearest' 
                    ? "No properties found within 50 km of your location. Try changing the sort option or adjusting filters." 
                    : "Try adjusting your filters or searching in a different city."
                  }
                  action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
                />
              )}

            </main>
          </div>
        </div>
      </div>
    </>
  )
}
