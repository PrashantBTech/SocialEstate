import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CITIES = ['Indore', 'Bhopal', 'Jabalpur', 'Raipur', 'Bilaspur', 'Ujjain', 'Gwalior', 'Sagar', 'Satna', 'Rewa', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Lucknow']

const TABS = [
  {
    key: 'sale', label: 'Buy',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  },
  {
    key: 'rent', label: 'Rent',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
  },
  {
    key: 'project', label: 'New Launch',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
  },
  {
    key: 'commercial', label: 'Commercial',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  },
  {
    key: 'plot', label: 'Plots/Land',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
  },
]

export default function SearchBar({ variant = 'hero' }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [activeTab, setActiveTab] = useState('sale')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()
  const sugRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (sugRef.current && !sugRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('city', query)

    if (activeTab === 'project') {
      navigate(`/projects?${params.toString()}`)
    } else if (activeTab === 'commercial') {
      params.set('propertyType', 'shop')
      navigate(`/listings?${params.toString()}`)
    } else if (activeTab === 'plot') {
      params.set('propertyType', 'plot')
      navigate(`/listings?${params.toString()}`)
    } else {
      params.set('listingType', activeTab)
      if (type && type !== 'all') params.set('propertyType', type)
      navigate(`/listings?${params.toString()}`)
    }
  }

  const handleQueryChange = (val) => {
    setQuery(val)
    if (val.length > 1) {
      const filtered = CITIES.filter(c => c.toLowerCase().startsWith(val.toLowerCase()))
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const isHero = variant === 'hero'

  return (
    <div className={isHero ? 'w-full' : ''}>
      {/* Tabs */}
      {isHero && (
        <div className="flex gap-0 mb-0">
          {TABS.map(tab => (
            <button key={tab.key} type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-semibold transition-all relative ${
                activeTab === tab.key
                  ? 'bg-white text-primary-600 rounded-t-xl'
                  : 'bg-white/60 text-navy-600 hover:bg-white/80 rounded-t-xl'
              }`}>
              <span className="hidden sm:inline mr-1.5">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />
              )}
              {tab.key === 'project' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch}>
        <div className={`flex flex-col sm:flex-row items-stretch gap-2 p-3 ${
          isHero
            ? 'bg-white rounded-b-xl rounded-tr-xl shadow-search'
            : 'bg-white rounded-xl border border-gray-200 shadow-card'
        }`}>
          {/* Property type selector (only for Buy/Rent tabs) */}
          {(activeTab === 'sale' || activeTab === 'rent') && (
            <div className="relative">
              <select value={type} onChange={e => setType(e.target.value)}
                className="appearance-none sm:w-48 w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-navy-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer pr-8">
                <option value="all">All Residential ▾</option>
                <option value="flat">Flat / Apartment</option>
                <option value="house">Independent House</option>
                <option value="builder_floor">Builder Floor</option>
                <option value="1rk">1RK / Studio</option>
                <option value="farmhouse">Farmhouse</option>
              </select>
            </div>
          )}

          {/* City input with suggestions */}
          <div className="flex-1 relative" ref={sugRef}>
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-transparent transition-all">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder={`Search "${activeTab === 'project' ? 'New projects in Bhopal' : 'Flats for sale in Indore'}"`}
                className="flex-1 bg-transparent border-0 text-sm focus:outline-none text-navy-900 placeholder:text-gray-400 font-medium" />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-card-hover border border-gray-100 z-20 overflow-hidden animate-slide-down">
                {suggestions.map(city => (
                  <button key={city} type="button"
                    onClick={() => { setQuery(city); setShowSuggestions(false) }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-primary-50 text-navy-700 flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] inline-flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </form>
    </div>
  )
}
