export const formatPrice = (amount) => {
  if (!amount) return '—'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export const formatArea = (value, unit = 'sqft') => {
  if (!value) return '—'
  const labels = { sqft: 'sq.ft', sqyd: 'sq.yd', marla: 'Marla', biswa: 'Biswa', acres: 'Acres', bigha: 'Bigha' }
  return `${value.toLocaleString()} ${labels[unit] || unit}`
}

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatRelative = (date) => {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return formatDate(date)
}

export const propertyTypeLabel = (type) => ({
  flat: 'Flat / Apartment', house: 'Independent House', builder_floor: 'Builder Floor',
  plot: 'Plot / Land', '1rk': '1RK Studio', farmhouse: 'Farmhouse',
  shop: 'Shop / Showroom', office: 'Office Space', warehouse: 'Warehouse', other: 'Other'
})[type] || type

export const statusColor = (status) => ({
  active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  pending_review: 'text-amber-700 bg-amber-50 border-amber-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
  expired: 'text-gray-600 bg-gray-50 border-gray-200',
  sold: 'text-primary-600 bg-primary-50 border-primary-200',
  new_launch: 'text-purple-700 bg-purple-50 border-purple-200',
  under_construction: 'text-orange-700 bg-orange-50 border-orange-200',
  ready: 'text-emerald-700 bg-emerald-50 border-emerald-200',
})[status] || 'text-gray-600 bg-gray-50'

export const formatDistance = (meters) => {
  if (meters == null) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
