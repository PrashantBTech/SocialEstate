import useAuthStore from '@/store/authStore'
import OwnerDashboard from './OwnerDashboard'
import { Navigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuthStore()
  
  if (user?.role === 'owner' || user?.role === 'builder') {
    return <OwnerDashboard />
  }
  
  // For buyers, directly open the Listing Feed as their dashboard
  return <Navigate to="/listings" replace />
}
