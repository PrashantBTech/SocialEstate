import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/components/layout/ProtectedRoute'
import { PageLoader } from '@/components/common/LoadingSpinner'

// Lazy-load pages for code splitting
const Home             = lazy(() => import('@/pages/Home'))
const ListingFeed      = lazy(() => import('@/pages/ListingFeed'))
const ListingDetail    = lazy(() => import('@/pages/ListingDetail'))
const ProjectFeed      = lazy(() => import('@/pages/ProjectFeed'))
const Login            = lazy(() => import('@/pages/Auth/Login'))
const Register         = lazy(() => import('@/pages/Auth/Register'))
const Dashboard        = lazy(() => import('@/pages/Dashboard/Dashboard'))
const MyListings       = lazy(() => import('@/pages/Dashboard/MyListings'))
const CreateListing    = lazy(() => import('@/pages/Listing/CreateListing'))
const Profile          = lazy(() => import('@/pages/Profile'))
const NotFound         = lazy(() => import('@/pages/NotFound'))
const StaticPage       = lazy(() => import('@/pages/StaticPage'))

// Admin pages
const AdminDashboard   = lazy(() => import('@/pages/Admin/AdminDashboard'))
const AdminListings    = lazy(() => import('@/pages/Admin/AdminListings'))
const AdminProjects    = lazy(() => import('@/pages/Admin/AdminProjects'))
const AdminEnquiries   = lazy(() => import('@/pages/Admin/AdminEnquiries'))
const AdminDeals       = lazy(() => import('@/pages/Admin/AdminDeals'))
const AdminUsers       = lazy(() => import('@/pages/Admin/AdminUsers'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<ListingFeed />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/projects" element={<ProjectFeed />} />

          {/* Static Pages */}
          <Route path="/about" element={<StaticPage title="About SocialEstate" />} />
          <Route path="/contact" element={<StaticPage title="Contact Us" />} />
          <Route path="/careers" element={<StaticPage title="Careers" />} />
          <Route path="/privacy" element={<StaticPage title="Privacy Policy" />} />
          <Route path="/terms" element={<StaticPage title="Terms of Service" />} />
          <Route path="/pricing" element={<StaticPage title="Pricing & Plans" />} />
          <Route path="/refund" element={<StaticPage title="Refund Policy" />} />
          <Route path="/sitemap" element={<StaticPage title="Sitemap" />} />

          {/* Guest only */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="deals" element={<AdminDeals />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
