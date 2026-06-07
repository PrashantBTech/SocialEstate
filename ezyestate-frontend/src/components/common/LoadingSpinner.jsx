export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizes[size]} border-2 border-primary-100 border-t-primary-500 rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-500 font-body">{text}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-primary-100 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display text-primary-700">Loading SocialEstate...</p>
      </div>
    </div>
  )
}
