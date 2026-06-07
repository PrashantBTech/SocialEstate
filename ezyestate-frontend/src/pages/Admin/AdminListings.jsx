import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getAllListings, approveListing, rejectListing, featureListing, approveEdit, rejectEdit } from '@/api/adminApi'
import { formatPrice, formatDate, statusColor, propertyTypeLabel } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'active', label: 'Active' },
  { value: 'pending_edit', label: 'Pending Edits' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'sold', label: 'Sold' },
]

function RejectModal({ listing, onClose, onReject }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <h3 className="font-display font-semibold text-primary-900 mb-2">Reject Listing</h3>
        <p className="text-sm text-gray-500 mb-4">Please provide a reason. The owner will be notified.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          className="input min-h-[100px] resize-none mb-4"
          placeholder="e.g. Photos are unclear, price not mentioned correctly..." />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button onClick={() => onReject(reason)} disabled={!reason.trim()}
            className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center disabled:opacity-50 hover:bg-red-600">
            Reject Listing
          </button>
        </div>
      </div>
    </div>
  )
}

function EditReviewModal({ listing, onClose, onApprove, onReject }) {
  if (!listing || !listing.proposedEdits) return null
  const edits = listing.proposedEdits

  const diffFields = Object.keys(edits).filter(k => {
    // Basic comparison
    if (typeof edits[k] === 'object') return JSON.stringify(edits[k]) !== JSON.stringify(listing[k])
    return edits[k] !== listing[k]
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-900 text-white">
          <div>
            <h3 className="font-display font-bold text-xl">Review Proposed Edits</h3>
            <p className="text-primary-100 text-xs mt-1">Comparing changes for: {listing.location?.locality}, {listing.location?.city}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 mb-6 sticky top-0 z-10">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Live Version</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Proposed New Version</span>
            </div>
          </div>

          <div className="space-y-4">
            {diffFields.map(field => {
              const currentVal = listing[field]
              const newVal = edits[field]

              return (
                <div key={field} className="grid grid-cols-2 gap-4 group">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group-hover:border-primary-200 transition-all">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{field.replace(/([A-Z])/g, ' $1')}</p>
                    <div className="text-sm text-gray-600 line-through opacity-60">
                      {typeof currentVal === 'object' ? JSON.stringify(currentVal, null, 2) : String(currentVal || 'Empty')}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-emerald-500 shadow-md transform hover:scale-[1.01] transition-all">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase mb-2">{field.replace(/([A-Z])/g, ' $1')}</p>
                    <div className="text-sm text-primary-900 font-semibold">
                      {typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : String(newVal)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
          <button onClick={onReject} className="px-6 py-3 border-2 border-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex-1">
            Reject Changes
          </button>
          <button onClick={onApprove} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex-1 shadow-lg shadow-emerald-200">
            Approve & Go Live
          </button>
        </div>
      </div>
    </div>
  )
}

function ListingDetailModal({ listing, onClose }) {
  if (!listing) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-primary-900">{propertyTypeLabel(listing.propertyType)} — {formatPrice(listing.askingPrice)}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {listing.photos?.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {listing.photos.slice(0, 6).map((p, i) => (
              <img key={i} src={p.url} alt="" className="rounded-lg h-24 w-full object-cover" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {[
            ['Location', `${listing.location?.locality}, ${listing.location?.city}, ${listing.location?.state}`],
            ['Pincode', listing.location?.pincode],
            ['Price', `${formatPrice(listing.askingPrice)} ${listing.isPriceNegotiable ? '(Negotiable)' : ''}`],
            ['Type', propertyTypeLabel(listing.propertyType)],
            ['Area', listing.totalArea ? `${listing.totalArea.value} ${listing.totalArea.unit}` : '—'],
            ['BHK', listing.bedrooms?.toUpperCase() || '—'],
            ['Possession', listing.possessionStatus?.replace('_', ' ') || '—'],
            ['Ownership', listing.ownershipType || '—'],
            ['Service Fee', listing.serviceFee?.status === 'paid' ? '✅ Paid' : '❌ Not Paid'],
            ['Listed On', formatDate(listing.createdAt)],
            ['Owner', listing.owner?.fullName],
            ['Owner Mobile', listing.owner?.mobile],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-medium text-primary-800 mt-0.5 capitalize">{value || '—'}</p>
            </div>
          ))}
        </div>

        {listing.description && (
          <div className="bg-primary-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{listing.description}</p>
          </div>
        )}

        {listing.documentsAvailable?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Documents Available</p>
            <div className="flex gap-2 flex-wrap">
              {listing.documentsAvailable.map(d => (
                <span key={d} className="badge-verify capitalize">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminListings() {
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [cityFilter, setCityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedListing, setSelectedListing] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [editReviewTarget, setEditReviewTarget] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', statusFilter, cityFilter, page],
    queryFn: () => {
      const params = { city: cityFilter || undefined, page, limit: 20 }
      if (statusFilter === 'pending_edit') {
        params.editStatus = 'pending'
      } else {
        params.status = statusFilter || undefined
      }
      return getAllListings(params)
    },
    select: d => d.data.data,
    keepPreviousData: true,
  })

  const approve = useMutation({
    mutationFn: (id) => approveListing(id),
    onSuccess: () => {
      toast.success('Listing approved and is now live!')
      queryClient.invalidateQueries(['admin-listings'])
      queryClient.invalidateQueries(['admin-dashboard'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed'),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }) => rejectListing(id, { reason }),
    onSuccess: () => {
      toast.success('Listing rejected. Owner notified.')
      setRejectTarget(null)
      queryClient.invalidateQueries(['admin-listings'])
    },
  })

  const feature = useMutation({
    mutationFn: (id) => featureListing(id),
    onSuccess: () => {
      toast.success('Featured status updated!')
      queryClient.invalidateQueries(['admin-listings'])
    },
  })

  const approveListingEdit = useMutation({
    mutationFn: (id) => approveEdit(id),
    onSuccess: () => {
      toast.success('Proposed edits approved and applied!')
      setEditReviewTarget(null)
      queryClient.invalidateQueries(['admin-listings'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed'),
  })

  const rejectListingEdit = useMutation({
    mutationFn: ({ id, reason }) => rejectEdit(id, { reason }),
    onSuccess: () => {
      toast.success('Proposed edits rejected.')
      setEditReviewTarget(null)
      queryClient.invalidateQueries(['admin-listings'])
    },
  })

  return (
    <>
      <Helmet><title>Manage Listings | Admin — SocialEstate</title></Helmet>

      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onReject={(reason) => reject.mutate({ id: rejectTarget._id, reason })}
        />
      )}

      {selectedListing && (
        <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}

      {editReviewTarget && (
        <EditReviewModal 
          listing={editReviewTarget} 
          onClose={() => setEditReviewTarget(null)}
          onApprove={() => approveListingEdit.mutate(editReviewTarget._id)}
          onReject={() => rejectListingEdit.mutate({ id: editReviewTarget._id, reason: 'Does not meet guidelines' })}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">Listings Management</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.pagination?.total || 0} total listings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <input value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1) }}
              className="input py-1.5 text-sm w-40" placeholder="Filter by city..." />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden p-0">
        {isLoading ? <LoadingSpinner text="Loading listings..." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Property</th>
                  <th className="table-th">Owner</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Fee</th>
                  <th className="table-th">Score</th>
                  <th className="table-th">Listed</th>
                  <th className="table-th text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.listings?.length > 0 ? data.listings.map(listing => (
                  <tr key={listing._id} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                    <td className="table-td">
                      <button onClick={() => setSelectedListing(listing)} className="flex items-center gap-2.5 text-left hover:underline">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                          {listing.photos?.[0]?.url
                            ? <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                            : <span className="w-full h-full flex items-center justify-center text-base">�</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-800">{propertyTypeLabel(listing.propertyType)}</p>
                          <p className="text-xs text-gray-400">{listing.photos?.length || 0} photos</p>
                        </div>
                      </button>
                    </td>
                    <td className="table-td">
                      <p className="text-sm font-medium text-gray-800">{listing.owner?.fullName || '—'}</p>
                      <p className="text-xs text-gray-400">{listing.owner?.mobile}</p>
                    </td>
                    <td className="table-td font-semibold text-primary-700">{formatPrice(listing.askingPrice)}</td>
                    <td className="table-td">
                      <p className="text-sm text-gray-700">{listing.location?.city}</p>
                      <p className="text-xs text-gray-400">{listing.location?.locality}</p>
                    </td>
                    <td className="table-td">
                      <span className={`badge border text-xs ${statusColor(listing.status)}`}>
                        {listing.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-td">
                      {listing.serviceFee?.status === 'paid'
                        ? <span className="text-xs text-emerald-600 font-medium">✓ Paid</span>
                        : <span className="text-xs text-red-500">✗ Pending</span>}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-400 rounded-full" style={{ width: `${listing.propertyScore || 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{listing.propertyScore || 0}%</span>
                      </div>
                    </td>
                    <td className="table-td text-xs text-gray-500">{formatDate(listing.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {listing.editStatus === 'pending' && (
                          <button onClick={() => setEditReviewTarget(listing)}
                            className="text-xs bg-amber-500 text-white px-2.5 py-1 rounded-lg hover:bg-amber-600 shadow-sm shadow-amber-200">
                             Review Edits
                          </button>
                        )}
                        {listing.status === 'pending_review' && listing.serviceFee?.status === 'paid' && (
                          <button onClick={() => approve.mutate(listing._id)}
                            disabled={approve.isPending}
                            className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                            ✓ Approve
                          </button>
                        )}
                        {listing.status === 'pending_review' && (
                          <button onClick={() => setRejectTarget(listing)}
                            className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100">
                            ✗ Reject
                          </button>
                        )}
                        {listing.status === 'active' && (
                          <button onClick={() => feature.mutate(listing._id)}
                            className={`text-xs px-2.5 py-1 rounded-lg border ${
                              listing.isFeatured
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50'
                            }`}>
                            {listing.isFeatured ? ' Featured' : '☆ Feature'}
                          </button>
                        )}
                        <button onClick={() => setSelectedListing(listing)}
                          className="text-xs text-primary-500 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg hover:bg-primary-100">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                      No listings found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {data?.pagination && (
          <div className="p-4 border-t border-gray-50">
            <Pagination page={page} total={data.pagination.total} limit={20} onPageChange={setPage} />
          </div>
        )}
      </div>
    </>
  )
}
