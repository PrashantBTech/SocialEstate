import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { getDashboard, getAllEnquiries, getAllDeals } from '@/api/adminApi'
import { formatPrice, formatDate } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const DEFAULT_MONTHLY_DATA = [
  { month: 'Aug', listings: 8, deals: 2, revenue: 1.5 },
  { month: 'Sep', listings: 12, deals: 3, revenue: 2.2 },
  { month: 'Oct', listings: 18, deals: 5, revenue: 3.8 },
  { month: 'Nov', listings: 22, deals: 7, revenue: 5.5 },
  { month: 'Dec', listings: 30, deals: 9, revenue: 7.2 },
  { month: 'Jan', listings: 45, deals: 12, revenue: 10.5 },
]

const PIE_COLORS = ['#D85A30', '#E9C46A', '#2D9CDB', '#27AE60', '#9B51E0']

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getDashboard(),
    select: d => d.data.data,
    refetchInterval: 60000,
  })

  const { data: enquiries } = useQuery({
    queryKey: ['admin-enquiries', 'new'],
    queryFn: () => getAllEnquiries({ status: 'new', limit: 5 }),
    select: d => d.data.data.enquiries,
  })

  const { data: deals } = useQuery({
    queryKey: ['admin-deals', 'active'],
    queryFn: () => getAllDeals({ stage: 'deal_in_progress', limit: 5 }),
    select: d => d.data.data.deals,
  })

  if (isLoading) return <LoadingSpinner size="lg" text="Loading dashboard..." />

  const statCards = [
    { 
      label: 'Active Listings', 
      value: stats?.listings?.active || 0, 
      sub: `${stats?.listings?.pending || 0} pending review`, 
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ), 
      color: 'bg-orange-50', 
      accent: 'text-primary-600', 
      link: '/admin/listings' 
    },
    { 
      label: 'New Enquiries', 
      value: stats?.enquiries?.new || 0, 
      sub: `${stats?.enquiries?.total || 0} total`, 
      icon: (
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ), 
      color: 'bg-primary-50', 
      accent: 'text-primary-500', 
      link: '/admin/enquiries' 
    },
    { 
      label: 'Deals In Progress', 
      value: stats?.deals?.inProgress || 0, 
      sub: `${stats?.deals?.closedThisMonth || 0} closed this month`, 
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ), 
      color: 'bg-emerald-50', 
      accent: 'text-emerald-600', 
      link: '/admin/deals' 
    },
    { 
      label: 'Total Users', 
      value: stats?.users?.total || 0, 
      sub: 'Owners, Builders & Buyers', 
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ), 
      color: 'bg-purple-50', 
      accent: 'text-purple-600', 
      link: '/admin/users' 
    },
  ]

  const pieData = stats?.pieData || [
    { name: 'Plots', value: 35 }, { name: 'Flats', value: 28 }, { name: 'Houses', value: 18 },
    { name: 'Commercial', value: 12 }, { name: 'Other', value: 7 },
  ]

  const chartMonthlyData = stats?.monthlyData || DEFAULT_MONTHLY_DATA;

  return (
    <>
      <Helmet><title>Admin Dashboard | SocialEstate</title></Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">SocialEstate operations at a glance</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/listings?status=pending_review" className="btn-primary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Pending ({stats?.listings?.pending || 0})
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <Link key={card.label} to={card.link} className="admin-card hover:shadow-card-hover transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-xl`}>{card.icon}</div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className={`font-display text-3xl font-bold ${card.accent}`}>{card.value}</p>
            <p className="text-sm font-medium text-primary-800 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Growth Chart */}
        <div className="admin-card lg:col-span-2">
          <h3 className="font-display font-semibold text-primary-800 mb-4">Platform Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartMonthlyData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #f0e8e0', fontSize: 12 }} />
              <Bar dataKey="listings" fill="#D85A30" radius={[4, 4, 0, 0]} name="Listings" />
              <Bar dataKey="deals" fill="#E9C46A" radius={[4, 4, 0, 0]} name="Deals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="admin-card">
          <h3 className="font-display font-semibold text-primary-800 mb-4">By Property Type</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-xs text-gray-500">{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Line Chart */}
      <div className="admin-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-primary-800">Revenue Trend (₹L)</h3>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">↑ 32% vs last month</span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartMonthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #f0e8e0', fontSize: 12 }} formatter={v => [`₹${v}L`, 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#D85A30" strokeWidth={2.5} dot={{ fill: '#D85A30', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New Enquiries */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-primary-800">New Enquiries</h3>
            <Link to="/admin/enquiries?status=new" className="text-xs text-primary-600 hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {enquiries?.length > 0 ? enquiries.map(enq => (
              <div key={enq._id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 flex-shrink-0">
                  {enq.buyer?.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-800 truncate">{enq.buyer?.fullName || 'Unknown Buyer'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {enq.listing?.propertyType || enq.project?.projectName} · {formatDate(enq.createdAt)}
                  </p>
                </div>
                <Link to="/admin/enquiries" className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100 flex-shrink-0">Handle</Link>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-6">No new enquiries</p>
            )}
          </div>
        </div>

        {/* Active Deals */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-primary-800">Active Deals</h3>
            <Link to="/admin/deals" className="text-xs text-primary-600 hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {deals?.length > 0 ? deals.map(deal => (
              <div key={deal._id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-800 truncate">
                    {deal.buyer?.fullName} ↔ {deal.seller?.fullName || 'Builder'}
                  </p>
                  {deal.dealValue && <p className="text-xs text-emerald-600 font-medium">{formatPrice(deal.dealValue)}</p>}
                </div>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0 capitalize">
                  {deal.stage?.replace(/_/g, ' ')}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-6">No active deals</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
