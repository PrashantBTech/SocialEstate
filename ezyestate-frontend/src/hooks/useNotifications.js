import { useQuery } from '@tanstack/react-query'
import { getMyListings } from '@/api/listingApi'

export default function useNotifications(isAuthenticated) {
  const { data: listings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings(),
    select: d => d.data.data.listings,
    enabled: !!isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds for "real-time" feel
  })

  if (!listings) return []

  let list = []
  listings.forEach(l => {
    // Created
    if (l.createdAt) {
      list.push({
        id: `${l._id}-created`,
        type: 'created',
        color: 'bg-primary-500',
        title: 'New Listing Drafted',
        desc: `You started a new listing for ${l.location?.locality || 'Property'}.`,
        date: new Date(l.createdAt)
      })
    }

    // Paid
    if (l.serviceFee?.status === 'paid') {
      list.push({
        id: `${l._id}-paid`,
        type: 'payment',
        color: 'bg-indigo-500',
        title: 'Payment Successful',
        desc: `Service fee paid for ${l.location?.locality || 'Property'}.`,
        date: new Date(l.serviceFee.paidAt || l.updatedAt)
      })
    }

    // Live (Active)
    if (l.status === 'active') {
      list.push({
        id: `${l._id}-active`,
        type: 'active',
        color: 'bg-emerald-500',
        title: 'Listing is Live!',
        desc: `Your listing in ${l.location?.locality || 'Property'} was approved and is now live!`,
        date: new Date(l.listedAt || l.updatedAt)
      })
    }

    // Pending Review
    if (l.status === 'pending_review' && l.serviceFee?.status === 'paid') {
      list.push({
        id: `${l._id}-review`,
        type: 'review',
        color: 'bg-amber-500',
        title: 'Pending Approval',
        desc: `Your listing in ${l.location?.locality || 'Property'} is under review by our admin team.`,
        date: new Date(l.updatedAt)
      })
    }

    // Rejected
    if (l.status === 'rejected') {
      list.push({
        id: `${l._id}-rejected`,
        type: 'rejected',
        color: 'bg-red-500',
        title: 'Listing Rejected',
        desc: `Your listing in ${l.location?.locality || 'Property'} was rejected. Please check the details.`,
        date: new Date(l.updatedAt)
      })
    }

    // Expired
    if (l.status === 'expired') {
      list.push({
        id: `${l._id}-expired`,
        type: 'expired',
        color: 'bg-gray-400',
        title: 'Listing Expired',
        desc: `Your listing in ${l.location?.locality || 'Property'} has reached its end date.`,
        date: new Date(l.updatedAt)
      })
    }
  })

  // Sort descending by date
  return list.sort((a, b) => b.date - a.date)
}
