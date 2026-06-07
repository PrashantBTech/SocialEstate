import { useState, useRef, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/authStore'
import { getMyListings } from '@/api/listingApi'
import { initials } from '@/utils/formatters'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import { Link, useNavigate } from 'react-router-dom'

function SavedPropertiesTab() {
  const { user, fetchMe } = useAuthStore()

  // Always fetch fresh populated data when this tab mounts
  useEffect(() => { fetchMe() }, [])

  // Filter to only populated objects (skip raw string IDs from stale localStorage)
  const savedListings = (user?.shortlistedListings || []).filter(
    (item) => item && typeof item === 'object' && item._id
  )

  const formatPrice = (price) => {
    if (!price) return ''
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatType = (type) => {
    if (!type) return ''
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  if (savedListings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-navy-50 text-navy-400 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-navy-900 mb-2">No Saved Properties</h3>
        <p className="text-sm text-gray-500 mb-6">Properties you save by clicking the heart icon will appear here.</p>
        <Link to="/listings?listingType=sale" className="inline-block px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors shadow-sm">Browse Properties</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {savedListings.map(listing => (
        <Link key={listing._id} to={`/listings/${listing._id}`} className="group block">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            {/* Image */}
            <div className="relative h-52 bg-gray-100 overflow-hidden">
              {listing.photos && listing.photos[0] ? (
                <img src={listing.photos[0].url || listing.photos[0]} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" /></svg>
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                {listing.intent && (
                  <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-md text-[10px] font-bold uppercase tracking-wider text-navy-800 shadow-sm">
                    {listing.intent === 'sell' ? 'For Sale' : 'For Rent'}
                  </span>
                )}
                {listing.isFeatured && (
                  <span className="px-2.5 py-1 bg-primary-500 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Featured
                  </span>
                )}
              </div>
              {/* Heart icon */}
              <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
            </div>
            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-[15px] text-navy-900 leading-tight capitalize line-clamp-1">
                  {formatType(listing.propertyType)} in {listing.location?.locality || listing.location?.city}
                </h4>
                {listing.askingPrice && (
                  <span className="text-[15px] font-bold text-navy-900 whitespace-nowrap">{formatPrice(listing.askingPrice)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                <span className="text-xs truncate">{[listing.location?.locality, listing.location?.city].filter(Boolean).join(', ')}</span>
              </div>
              {/* Property details chips */}
              {(listing.bedrooms || listing.totalArea?.value) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  {listing.bedrooms && listing.bedrooms !== 'na' && (
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">{listing.bedrooms.toUpperCase()}</span>
                  )}
                  {listing.totalArea?.value && (
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">{listing.totalArea.value} {listing.totalArea.unit}</span>
                  )}
                  {listing.possessionStatus && (
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md capitalize">{listing.possessionStatus === 'ready' ? 'Ready to Move' : listing.possessionStatus.replace(/_/g, ' ')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function BuyerProfile({ user, logout }) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const { setUser } = useAuthStore()

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      const uploadData = new FormData()
      uploadData.append('avatar', file)
      try {
        const res = await api.patch('/auth/upload-avatar', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res.data.data.user) setUser(res.data.data.user)
        toast.success('Profile picture updated successfully!')
      } catch (err) {
        toast.error('Failed to upload picture')
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Assuming a generic update user endpoint exists, typically PUT /users/me
      const res = await api.patch('/auth/update-profile', {
        fullName: formData.fullName,
        email: formData.email,
      })
      if (res.data.data.user) {
        setUser(res.data.data.user)
      }
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    }
    setSaving(false)
  }

  const joinYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-8 px-4">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-xl font-bold ring-4 ring-white shadow-sm bg-cover bg-center overflow-hidden" style={(photoPreview || user?.avatar) ? { backgroundImage: `url(${photoPreview || user?.avatar})` } : {}}>
                {!(photoPreview || user?.avatar) && initials(user?.fullName)}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center z-10 translate-x-1/4 translate-y-1/4">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Buyer</p>
              <h2 className="text-lg font-bold text-navy-900 leading-none">{user?.fullName}</h2>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">My Activity</h3>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group cursor-pointer hover:border-navy-200 transition-colors w-full">
              <div className="w-6 h-6 rounded bg-navy-50 text-navy-600 flex items-center justify-center mb-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h4 className="text-2xl font-bold text-navy-900 mb-0.5">{user?.shortlistedListings?.length || 0}</h4>
              <p className="text-[10px] text-gray-500 font-medium">Saved Properties</p>
              <svg className="w-3 h-3 absolute top-3 right-3 text-gray-300 group-hover:text-navy-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Manage Account</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {[
                { id: 'saved', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Saved Properties' },
                { id: 'privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Privacy & Security' },
                { id: 'support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', label: 'Support' }
              ].map((item, i) => (
                <button key={i} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group ${activeTab === item.id ? 'bg-navy-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                    </div>
                    <span className={`text-xs font-medium ${activeTab === item.id ? 'text-primary-500' : 'text-gray-700'}`}>{item.label}</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
            <button onClick={logout} className="mt-4 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider px-2">
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              {activeTab === 'profile' ? (
                <>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Edit Profile
                </>
              ) : activeTab === 'saved' ? (
                <>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Saved Properties
                </>
              ) : 'Settings'}
            </h2>
            {activeTab !== 'profile' && (
              <button onClick={() => setActiveTab('profile')} className="text-primary-500 hover:text-primary-600 text-sm font-medium">Back to Profile</button>
            )}
          </div>

          {activeTab === 'saved' ? (
            <SavedPropertiesTab />
          ) : activeTab === 'profile' ? (
            <form onSubmit={handleSave} className="max-w-2xl mx-auto">
              <div className="flex flex-col items-center mb-8">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-2xl font-bold bg-cover bg-center overflow-hidden" style={(photoPreview || user?.avatar) ? { backgroundImage: `url(${photoPreview || user?.avatar})` } : {}}>
                    {!(photoPreview || user?.avatar) && initials(user?.fullName)}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-primary-600 transition-colors z-10 shadow-sm translate-x-1 translate-y-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-primary-500 font-medium hover:underline">Update profile picture</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase">Full Name</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-navy-900 focus:ring-1 focus:ring-navy-900 focus:border-navy-900 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase">Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-navy-900 focus:ring-1 focus:ring-navy-900 focus:border-navy-900 outline-none transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase">Phone Number</label>
                  <input type="text" value={user?.mobile || '—'} readOnly className="w-full md:w-1/2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed outline-none" />
                </div>
              </div>



              <div className="flex items-center justify-center gap-4">
                <button type="button" className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors shadow-md disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-gray-500">Select an option from the menu.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function RealEstateProfile({ user, logout }) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    agencyName: user?.builderProfile?.companyName || '',
    bio: user?.builderProfile?.bio || user?.ownerProfile?.bio || ''
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const { setUser } = useAuthStore()
  const navigate = useNavigate()

  const { data: listings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings(),
    select: d => d.data.data.listings,
  })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      const uploadData = new FormData()
      uploadData.append('avatar', file)
      try {
        const res = await api.patch('/auth/upload-avatar', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res.data.data.user) setUser(res.data.data.user)
        toast.success('Profile picture updated successfully!')
      } catch (err) {
        toast.error('Failed to upload picture')
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/auth/update-profile', {
        fullName: formData.fullName,
        builderProfile: {
          ...user?.builderProfile,
          companyName: formData.agencyName,
          bio: formData.bio
        }
      })
      if (res.data.data.user) setUser(res.data.data.user)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto py-8 px-4">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
      </div>
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Edit Form (Left Area) */}
        <div className="w-full xl:w-2/5 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 order-2 xl:order-1">
          <div className="flex items-center mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-navy-900">
              {activeTab === 'profile' ? 'Edit Profile' : activeTab === 'saved' ? 'Saved Properties' : 'Settings'}
            </h2>
            <span className="ml-auto text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Real Estate</span>
          </div>

          {activeTab === 'saved' ? (
            <SavedPropertiesTab />
          ) : activeTab === 'profile' ? (
            <form onSubmit={handleSave}>
              <div className="flex flex-col items-center mb-8">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-2xl font-bold bg-cover bg-center overflow-hidden" style={(photoPreview || user?.avatar) ? { backgroundImage: `url(${photoPreview || user?.avatar})` } : {}}>
                    {!(photoPreview || user?.avatar) && initials(user?.fullName)}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-primary-600 transition-colors z-10 shadow-sm translate-x-1 translate-y-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-primary-500 font-medium hover:underline">Change Profile Photo</button>
              </div>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Full Name</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-navy-900 focus:ring-1 focus:ring-navy-900 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Agency Name</label>
                  <input type="text" value={formData.agencyName} onChange={e => setFormData({ ...formData, agencyName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-navy-900 focus:ring-1 focus:ring-navy-900 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Phone Number</label>
                  <input type="text" value={user?.mobile || '—'} readOnly className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Professional Bio</label>
                  <textarea rows="4" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600 focus:ring-1 focus:ring-navy-900 outline-none leading-relaxed"></textarea>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors shadow-md disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-gray-500">Select an option from the menu.</div>
          )}
        </div>

        {/* Dashboard Display (Right Area) */}
        <div className="w-full xl:w-3/5 order-1 xl:order-2 flex flex-col gap-6">

          {/* Profile Card & Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-2xl font-bold bg-cover bg-center overflow-hidden" style={(photoPreview || user?.avatar) ? { backgroundImage: `url(${photoPreview || user?.avatar})` } : {}}>
                  {!(photoPreview || user?.avatar) && initials(user?.fullName)}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center z-10 translate-x-1 translate-y-1">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy-900">{user?.fullName}</h2>
                {user?.builderProfile?.companyName && (
                  <div className="text-sm font-medium text-primary-500 mt-0.5">{user.builderProfile.companyName}</div>
                )}
                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-bold text-navy-900">{listings?.length || 0}</div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase">Listings</div>
                  </div>
                </div>
              </div>
            </div>

            {(user?.builderProfile?.bio || user?.ownerProfile?.bio) && (
              <div className="pt-5 border-t border-gray-100">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Professional Bio</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {user?.builderProfile?.bio || user?.ownerProfile?.bio}
                </p>
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-primary-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Performance</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">+12% growth in sales volume this quarter compared to previous.</p>
            </div>
            <div className="bg-navy-900 p-5 rounded-xl shadow-md flex flex-col justify-center relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-white">
                <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Verification</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">Elite Tier Specialist status verified through December 2026.</p>
              
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-navy-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Market Share</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Currently holding 18% market share in the Uptown luxury segment.</p>
            </div>
          </div> */}

          {/* Account Settings Menu */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
            <div className="p-6 pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Account Settings</h3>
            </div>
            <div className="px-2 pb-2">
              {[
                { id: 'listings', path: '/my-listings', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'My Listings' }
              ].map((item, i) => (
                <button key={i} onClick={() => item.path ? navigate(item.path) : setActiveTab(item.id)} className={`w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group rounded-xl ${activeTab === item.id ? 'bg-navy-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <svg className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-navy-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                    <span className={`text-sm font-medium ${activeTab === item.id ? 'text-primary-500' : 'text-gray-700'}`}>{item.label}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
              <button onClick={logout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group rounded-xl mt-2">
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span className="text-sm font-medium text-red-500 group-hover:text-red-600">Logout</span>
                </div>
                <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">Profile last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuthStore()

  return (
    <>
      <Helmet>
        <title>My Profile | SocialEstate</title>
      </Helmet>
      <div className="pt-20 min-h-screen bg-[#F5F7FA]">
        {user?.role === 'buyer'
          ? <BuyerProfile user={user} logout={logout} />
          : <RealEstateProfile user={user} logout={logout} />
        }
      </div>
    </>
  )
}
