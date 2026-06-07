import { Link } from 'react-router-dom'
import { formatPrice, formatArea, propertyTypeLabel, formatRelative, formatDistance } from '@/utils/formatters'
import { shortlistListing } from '@/api/listingApi'
import { useState } from 'react'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function PropertyCard({ listing, compact = false }) {
  const { isAuthenticated, user, setUser } = useAuthStore()
  const isSavedInit = user?.shortlistedListings?.includes(listing?._id) || false
  const [saved, setSaved] = useState(isSavedInit)
  const [saving, setSaving] = useState(false)

  if (!listing) return null

  const { _id, propertyType, location, askingPrice, photos, totalArea, bedrooms,
          isFeatured, isVerified, createdAt } = listing

  const img = photos?.[0]?.url

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) return toast.error('Login to save listings')
    setSaving(true)
    try {
      await shortlistListing(_id)
      setSaved(!saved)
      if (user) {
        const newList = saved 
          ? (user.shortlistedListings || []).filter(id => id !== _id)
          : [...(user.shortlistedListings || []), _id]
        setUser({ ...user, shortlistedListings: newList })
      }
      toast.success(saved ? 'Removed from shortlist' : 'Added to shortlist')
    } catch {}
    setSaving(false)
  }

  // Format short date for bottom right (e.g., "APR 10" or "TODAY")
  const getShortDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const diff = Date.now() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'TODAY'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  }

  return (
    <Link to={`/listings/${_id}`} className="group block bg-white rounded border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-gray-100 overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt={propertyTypeLabel(propertyType)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        
        {/* Badges (Bottom Left) */}
        <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap z-10">
          {isVerified && (
            <span className="text-[10px] font-bold bg-white text-navy-600 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
              <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Verified
            </span>
          )}
          {isFeatured && <span className="badge-feat">FEATURED</span>}
          {listing.distance != null && (
            <span className="text-[10px] font-bold bg-navy-950 text-white px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {formatDistance(listing.distance)} away
            </span>
          )}
        </div>

        {/* Elite Tag (Top Right Corner) */}
        {listing.propertyScore > 80 && (
          <div className="absolute top-0 right-0 bg-navy-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-md">
            <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            ELITE
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave} disabled={saving}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition-all z-20">
          <svg className={`w-4 h-4 ${saved ? 'text-navy-900 fill-current' : 'text-gray-900'}`} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 border-l-4 border-transparent hover:border-navy-600 transition-colors">
        
        {/* Price */}
        <p className="font-display font-black text-xl text-navy-950 dark:text-white mb-1">{formatPrice(askingPrice)}</p>

        {/* Specs: BHK - Bath - Sqft */}
        <p className="text-[13px] text-gray-600 truncate mb-1">
          {[
            bedrooms && bedrooms !== 'na' ? `${bedrooms.toUpperCase()}` : null,
            listing.bathrooms ? `${listing.bathrooms} Bathroom` : null,
            totalArea?.value ? formatArea(totalArea.value, totalArea.unit) : null
          ].filter(Boolean).join(' - ')}
        </p>

        {/* Title / Description */}
        <p className="text-[13px] text-gray-500 truncate mb-3">
          {propertyTypeLabel(propertyType)} in {location?.locality || location?.city}
        </p>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-auto pt-2 uppercase">
          <span className="flex items-center gap-1 truncate max-w-[75%]">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="truncate">{location?.locality ? `${location.locality}, ${location.city}` : location?.city}</span>
          </span>
          <span className="whitespace-nowrap ml-2">{getShortDate(createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
