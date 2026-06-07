import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getMyListings } from '@/api/listingApi'
import { formatPrice } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import useAuthStore from '@/store/authStore'
import { useState } from 'react'

export default function MyListings() {
  const { user } = useAuthStore()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings(),
    select: d => d.data.data.listings,
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Active</span>
      case 'pending_review': return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Under Review</span>
      case 'rejected': return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Rejected</span>
      case 'expired': return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Expired</span>
      default: return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{status}</span>
    }
  }

  const filteredListings = listings?.filter(l => {
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchesSearch = !searchQuery || l.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) || l.location?.locality?.toLowerCase().includes(searchQuery.toLowerCase()) || l.propertyType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage)
  const currentListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (isLoading) return <div className="pt-20 min-h-screen bg-[#F8FAFC] flex items-center justify-center"><LoadingSpinner /></div>

  return (
    <>
      <Helmet><title>My Listings | SocialEstate</title></Helmet>
      <div className="pt-24 pb-16 min-h-screen bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
            <div>
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy-900 transition-colors mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-900 tracking-tight">My Listings</h1>
              <p className="text-gray-500 text-sm mt-2">Manage your property portfolio and track performance.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-white outline-none shadow-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto h-11 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 px-4 cursor-pointer outline-none shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              <Link to="/create-listing" className="w-full sm:w-auto bg-primary-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-600 transition-colors inline-flex items-center justify-center gap-2 shadow-sm whitespace-nowrap h-11">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Post Property
              </Link>
            </div>
          </div>

          {filteredListings.length > 0 ? (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {currentListings.map(listing => (
                <div key={listing._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg hover:border-navy-200 transition-all duration-300">
                  <div className="relative h-52 bg-gray-100 overflow-hidden">
                    {listing.photos?.[0]?.url ? (
                      <img src={listing.photos[0].url} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {getStatusBadge(listing.status)}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="font-bold text-navy-900 text-[15px] leading-tight line-clamp-1 capitalize">
                          {listing.propertyType.replace('_', ' ')} in {listing.location.locality}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate font-medium">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {listing.location.city}, {listing.location.state}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[17px] font-bold text-primary-500">{formatPrice(listing.askingPrice)}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <Link to={`/listings/${listing._id}/edit`} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 hover:text-navy-900 hover:border-gray-300 transition-all shadow-sm" title="Edit Property">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </Link>
                        {listing.status === 'expired' ? (
                          <button className="bg-navy-900 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-navy-800 transition-colors shadow-md">
                            RELIST
                          </button>
                        ) : (
                          <Link to={`/listings/${listing._id}`} className="bg-white border-2 border-navy-900 text-navy-900 text-[11px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-navy-50 transition-colors shadow-sm">
                            VIEW
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 shadow-sm ${
                      currentPage === page 
                        ? 'bg-primary-500 text-white shadow-primary-500/30 ring-2 ring-primary-500 ring-offset-2' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-navy-900 hover:border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 text-primary-500 ring-8 ring-primary-50/50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-3">No Properties Found</h3>
              <p className="text-gray-500 text-[15px] max-w-md mx-auto mb-8 leading-relaxed">
                {searchQuery ? "We couldn't find any properties matching your search criteria. Try adjusting your filters." : "You haven't posted any properties yet. Start building your portfolio by creating your first listing."}
              </p>
              <Link to="/create-listing" className="inline-flex items-center gap-2 bg-primary-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Post Your First Property
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
