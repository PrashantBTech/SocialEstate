import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getMyListings } from '@/api/listingApi'
import { getMyPayments } from '@/api/paymentApi'
import { formatPrice, formatDate, statusColor } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import useAuthStore from '@/store/authStore'
import useNotifications from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import { useState, useCallback } from 'react'

function PropertyScoreBar({ score }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-primary-600 font-medium">{score}%</span>
    </div>
  )
}

export default function OwnerDashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const LS_KEY = `activity-cleared-${user?._id}`
  const [clearedBefore, setClearedBefore] = useState(() => {
    const saved = localStorage.getItem(`activity-cleared-${user?._id}`)
    return saved ? Number(saved) : 0
  })

  const handleClearActivity = useCallback(() => {
    const now = Date.now()
    localStorage.setItem(LS_KEY, String(now))
    setClearedBefore(now)
  }, [LS_KEY])

  const notifications = useNotifications(isAuthenticated())

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings(),
    select: d => d.data.data.listings,
  })

  const stats = {
    total: listings?.length || 0,
    active: listings?.filter(l => l.status === 'active').length || 0,
    totalViews: listings?.reduce((s, l) => s + (l.views || 0), 0) || 0,
    totalEnquiries: listings?.reduce((s, l) => s + (l.enquiryCount || 0), 0) || 0,
  }

  // Helper for status badge colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Active</span>
      case 'pending_review': return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Under Review</span>
      case 'rejected': return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Rejected</span>
      case 'expired': return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Expired</span>
      default: return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{status}</span>
    }
  }

  if (isLoading) return <div className="pt-20 min-h-screen bg-[#F8FAFC] flex items-center justify-center"><LoadingSpinner /></div>

  return (
    <>
      <Helmet><title>Portfolio Overview | SocialEstate</title></Helmet>
      <div className="pt-20 pb-12 min-h-screen bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-navy-900 tracking-tight">Portfolio Overview</h1>
              <p className="text-gray-500 text-sm mt-1">Monitor your property performance and management actions.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 px-3 cursor-pointer shadow-sm"
              >
                <option value="all">All Listings</option>
                <option value="active">Active Only</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              <Link to="/create-listing" className="bg-navy-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-colors inline-flex items-center gap-2 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Post a New Listing
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Total Views */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Total Views</p>
                <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
              </div>
              <div>
                <div className="flex items-end gap-2 mb-1">
                  <h2 className="text-3xl font-display font-bold text-navy-900 leading-none">{stats.totalViews.toLocaleString()}</h2>
                  <span className="text-xs font-semibold text-emerald-500 flex items-center mb-1">
                    <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    12%
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">Cumulative traffic across all listings this month.</p>
              </div>
            </div>

            {/* Leads Received */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Leads Received</p>
                <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
              <div>
                <div className="flex items-end gap-2 mb-1">
                  <h2 className="text-3xl font-display font-bold text-navy-900 leading-none">{stats.totalEnquiries.toLocaleString()}</h2>
                  <span className="text-xs font-semibold text-emerald-500 flex items-center mb-1">
                    <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    5%
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">New inquiries from potential buyers or tenants.</p>
              </div>
            </div>

            {/* Active Listings */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Active Listings</p>
                <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold text-navy-900 leading-none mb-3">{stats.active}</h2>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-500 h-full rounded-full" style={{ width: `${stats.total ? (stats.active / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left: Current Portfolio */}
            <div className="w-full lg:w-2/3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-navy-900 text-lg">Current Portfolio</h3>
                <Link to="/my-listings" className="text-xs font-semibold text-primary-500 hover:text-primary-700">View All</Link>
              </div>

              <div className="flex flex-col gap-4">
                {(() => {
                  const filteredListings = listings?.filter(l => filterStatus === 'all' || l.status === filterStatus) || [];
                  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
                  const currentListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  
                  if (filteredListings.length === 0 && listings?.length > 0) {
                    return <EmptyState title="No properties found" description="No properties match the selected filter." action={<button onClick={() => setFilterStatus('all')} className="btn-primary mt-2">Clear Filter</button>} />;
                  } else if (filteredListings.length === 0) {
                    return <EmptyState title="No properties found" description="You haven't listed any properties yet." action={<Link to="/create-listing" className="btn-primary mt-2">Post Property</Link>} />;
                  }

                  return (
                    <>
                      {currentListings.map(listing => (
                        <div key={listing._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 md:w-48 h-40 sm:h-auto flex-shrink-0 bg-gray-100 relative">
                      {listing.photos?.[0]?.url ? (
                        <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-navy-900 truncate">
                            {listing.propertyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} in {listing.location.locality}
                          </h4>
                          {getStatusBadge(listing.status)}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {listing.location.city}, {listing.location.state}
                        </p>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <span className="text-xl font-bold text-primary-500">{formatPrice(listing.askingPrice)}</span>

                        <div className="flex items-center gap-2">
                          <Link to={`/listings/${listing._id}/analytics`} className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-navy-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                          </Link>
                          <Link to={`/listings/${listing._id}/edit`} className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-navy-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </Link>
                          {listing.status === 'expired' ? (
                            <button className="bg-primary-500 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-primary-600 transition-colors">
                              Relist Now
                            </button>
                          ) : (
                            <Link to={`/listings/${listing._id}`} className="bg-navy-900 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-navy-800 transition-colors">
                              Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${
                          currentPage === page 
                            ? 'bg-primary-500 text-white shadow-sm' 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-navy-900'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
            </div>

            {/* Right: Recent Activity */}
            <div className="w-full lg:w-1/3">
              <h3 className="font-display font-bold text-navy-900 text-lg mb-4">Recent Activity</h3>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                <div className="relative border-l border-gray-100 ml-3 space-y-6 pb-2">

                  {(() => {
                    const visible = notifications.filter(n => n.date.getTime() > clearedBefore).slice(0, 5)
                    return visible.length > 0 ? visible.map((n) => (
                      <div key={n.id} className="relative pl-6">
                        <div className={`absolute w-2.5 h-2.5 ${n.color} rounded-full -left-[5px] top-1.5 ring-4 ring-white`}></div>
                        <p className="text-xs font-bold text-navy-900">{n.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.desc}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                          {formatDistanceToNow(n.date, { addSuffix: true })}
                        </p>
                      </div>
                    )) : (
                      <div className="text-center text-xs text-gray-500 py-4">No recent activity.</div>
                    )
                  })()}

                </div>

                <button
                  onClick={handleClearActivity}
                  disabled={notifications.filter(n => n.date.getTime() > clearedBefore).length === 0}
                  className="w-full mt-6 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Activity Log
                </button>
              </div>



            </div>
          </div>
        </div>
      </div>
    </>
  )
}
