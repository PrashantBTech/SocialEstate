import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore()
  const location = useLocation()
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export function AdminRoute({ children }) {
  const { token, user } = useAuthStore()
  const location = useLocation()
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!['admin', 'superadmin'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

export function GuestRoute({ children }) {
  const { token, user } = useAuthStore()
  if (token && user) return <Navigate to="/dashboard" replace />
  return children
}
