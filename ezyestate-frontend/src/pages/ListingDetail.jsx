import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getListingById, enquireListing, shortlistListing } from '@/api/listingApi'
import { formatPrice, formatArea, propertyTypeLabel, formatDate } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ListingDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [activeImg, setActiveImg] = useState(0)
  const [enquiring, setEnquiring] = useState(false)
  const [enquired, setEnquired] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id),
    select: d => d.data.data.listing,
  })

  const handleEnquire = async () => {
    if (!isAuthenticated()) return navigate('/login', { state: { from: { pathname: `/listings/${id}` } } })
    if (user?.role !== 'buyer') return toast.error('Only buyers can express interest')
    setEnquiring(true)
    try {
      await enquireListing(id)
      setEnquired(true)
      toast.success('Interest registered! Our team will contact you within 24 hours.')
    } catch {}
    setEnquiring(false)
  }

  const handleSave = async () => {
    if (!isAuthenticated()) return navigate('/login')
    try {
      await shortlistListing(id)
      setSaved(!saved)
      toast.success(saved ? 'Removed from shortlist' : 'Added to shortlist')
    } catch {}
  }

  if (isLoading) return <div className="pt-20"><LoadingSpinner size="lg" text="Loading property details..." /></div>
  if (error || !listing) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Property not found.</p>
        <Link to="/listings" className="btn-primary">Browse Listings</Link>
      </div>
    </div>
  )

  const { propertyType, location, askingPrice, isPriceNegotiable, possessionStatus, totalArea, builtupArea,
          bedrooms, bathrooms, facing, propertyAge, description, documentsAvailable, amenities, photos,
          isVerified, isFeatured, createdAt, expiresAt, propertyScore, ownershipType } = listing

  return (
    <>
      <Helmet>
        <title>{propertyTypeLabel(propertyType)} in {location?.city} — ₹{(askingPrice/100000).toFixed(1)}L | SocialEstate</title>
        <meta name="description" content={description || `${propertyTypeLabel(propertyType)} for sale in ${location?.city}`} />
      </Helmet>

      <div className="pt-16 min-h-screen bg-cream">
        <div className="page-container py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-body">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link to="/listings" className="hover:text-primary-600">Properties</Link>
            <span>/</span>
            <Link to={`/listings?city=${location?.city}`} className="hover:text-primary-600">{location?.city}</Link>
            <span>/</span>
            <span className="text-primary-700">{propertyTypeLabel(propertyType)}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left - Main Content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Photo Gallery */}
              <div className="card overflow-hidden">
                <div className="relative h-72 sm:h-96 bg-gradient-to-br from-primary-100 to-sand">
                  {photos?.length > 0 ? (
                    <img src={photos[activeImg]?.url} alt={`Photo ${activeImg + 1}`}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isFeatured && <span className="badge-feat"> Featured</span>}
                    {isVerified && <span className="badge-verify">✓ Verified</span>}
                  </div>
                  {photos?.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {activeImg + 1}/{photos.length}
                    </div>
                  )}
                </div>
                {photos?.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-gray-50">
                    {photos.map((p, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          i === activeImg ? 'border-primary-500' : 'border-transparent'
                        }`}>
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Details */}
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-primary-900">{formatPrice(askingPrice)}</h1>
                    <p className="text-gray-500 text-sm mt-1">{propertyTypeLabel(propertyType)}</p>
                    {isPriceNegotiable && <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1 inline-block">Price Negotiable</span>}
                  </div>
                  <button onClick={handleSave} className={`flex-shrink-0 p-2.5 rounded-xl border transition-colors ${
                    saved ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-primary-200'
                  }`}>
                    <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-5">
                  <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{location?.landmark && `${location.landmark}, `}{location?.locality}, {location?.city}, {location?.state} - {location?.pincode}</span>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Area', value: totalArea ? formatArea(totalArea.value, totalArea.unit) : '—' },
                    { label: 'Built-up Area', value: builtupArea ? formatArea(builtupArea.value, builtupArea.unit) : '—' },
                    { label: 'Bedrooms', value: bedrooms === 'na' ? 'N/A' : bedrooms?.toUpperCase() || '—' },
                    { label: 'Bathrooms', value: bathrooms || '—' },
                    { label: 'Facing', value: facing ? facing.charAt(0).toUpperCase() + facing.slice(1) : '—' },
                    { label: 'Property Age', value: { new: 'New', lt5: '<5 Years', '5to10': '5-10 Yrs', '10to20': '10-20 Yrs', '20plus': '20+ Yrs' }[propertyAge] || '—' },
                    { label: 'Possession', value: possessionStatus?.replace('_', ' ') || '—' },
                    { label: 'Ownership', value: { freehold: 'Freehold', leasehold: 'Leasehold', cooperative: 'Co-op' }[ownershipType] || '—' },
                  ].map(item => (
                    <div key={item.label} className="bg-primary-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-primary-800 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>

                {description && (
                  <div>
                    <h3 className="font-display font-semibold text-primary-800 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-body">{description}</p>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {amenities && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-primary-800 mb-4">Amenities & Features</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenities.parking?.available && <div className="flex items-center gap-2 text-sm text-gray-700"><span>�</span> {amenities.parking.type === 'both' ? 'Car + 2W Parking' : `${amenities.parking.type} Parking`}</div>}
                    {amenities.powerBackup && amenities.powerBackup !== 'no' && <div className="flex items-center gap-2 text-sm text-gray-700"><span>⚡</span> {amenities.powerBackup === 'yes' ? 'Full' : 'Partial'} Power Backup</div>}
                    {amenities.waterSupply && <div className="flex items-center gap-2 text-sm text-gray-700"><span>�</span> {amenities.waterSupply === 'both' ? 'Municipal + Borewell' : amenities.waterSupply}</div>}
                    {amenities.isGatedSociety && <div className="flex items-center gap-2 text-sm text-gray-700"><span>�</span> Gated Society</div>}
                    {amenities.loanAvailable === 'yes' && <div className="flex items-center gap-2 text-sm text-gray-700"><span>�</span> Loan Available</div>}
                  </div>
                  {amenities.nearbyLandmarks && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Nearby Landmarks</p>
                      <p className="text-sm text-gray-700">{amenities.nearbyLandmarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {documentsAvailable?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-primary-800 mb-3">Documents Available</h3>
                  <div className="flex flex-wrap gap-2">
                    {documentsAvailable.map(doc => (
                      <span key={doc} className="badge-verify capitalize">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right - CTA Sidebar */}
            <div className="space-y-4">
              {/* Enquiry Card */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">�</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Posted by</p>
                    <p className="text-sm font-medium text-primary-800">SocialEstate Team</p>
                  </div>
                </div>

                {isAuthenticated() && user?._id && (listing.owner?._id === user._id || listing.owner === user._id) ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">�</span>
                    </div>
                    <p className="font-medium text-primary-800 mb-1">Your Property</p>
                    <p className="text-xs text-gray-500 leading-relaxed">You are the owner of this listing.</p>
                    <Link to={`/listings/${id}/edit`} className="w-full mt-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors inline-block">
                      Edit Listing
                    </Link>
                  </div>
                ) : enquired ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-medium text-primary-800 mb-1">Interest Registered!</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Our team will call you within 24 hours to discuss this property.</p>
                  </div>
                ) : (
                  <>
                    <button onClick={handleEnquire} disabled={enquiring} className="btn-primary w-full justify-center mb-3">
                      {enquiring ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" /> : <span className="mr-2">�</span>}
                      {enquiring ? 'Registering...' : "I'm Interested — Call Me"}
                    </button>
                    <p className="text-xs text-gray-400 text-center">Our team will contact you within 24 hours. Owner details shared after verification.</p>
                  </>
                )}

                <div className="mt-5 pt-4 border-t border-gray-50 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Team verifies buyer before sharing seller details
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Site visit arranged by SocialEstate team
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Zero cost to buyers — always free
                  </div>
                </div>
              </div>

              {/* Property Score */}
              {propertyScore > 0 && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-primary-800">Listing Quality Score</p>
                    <span className="font-display font-bold text-primary-600">{propertyScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                      style={{ width: `${propertyScore}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Higher score = more visibility to buyers</p>
                </div>
              )}

              {/* Listing Meta */}
              <div className="card p-5 text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Listed on</span>
                  <span className="text-primary-800 font-medium">{formatDate(createdAt)}</span>
                </div>
                {expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active until</span>
                    <span className="text-primary-800 font-medium">{formatDate(expiresAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Listing ID</span>
                  <span className="text-gray-400 text-xs font-mono">{id?.slice(-8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
