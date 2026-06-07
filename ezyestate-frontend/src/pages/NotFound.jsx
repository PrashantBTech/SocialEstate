import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
export default function NotFound() {
  return (
    <>
      <Helmet><title>Page Not Found | SocialEstate</title></Helmet>
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-16">
        <div className="text-center">
          <p className="font-display text-8xl font-bold text-primary-500 mb-4">404</p>
          <h1 className="font-display text-2xl font-bold text-primary-900 mb-3">Page not found</h1>
          <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/" className="btn-primary">← Back to Home</Link>
        </div>
      </div>
    </>
  )
}
