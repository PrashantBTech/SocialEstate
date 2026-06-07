import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { initials } from '@/utils/formatters'
import useNotifications from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const { user, logout, isAuthenticated, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const dropRef = useRef(null)
  const notifRef = useRef(null)

  const notifications = useNotifications(isAuthenticated())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/') }

  const publicLinks = [
    { to: '/listings?listingType=sale', label: 'Buy' },
    { to: '/listings?listingType=rent', label: 'Rent' },
    { to: '/projects', label: 'New Projects' },
    { to: '/listings?propertyType=plot', label: 'Plots/Land' },
    { to: '/listings?propertyType=shop', label: 'Commercial' },
  ]
  
  const authLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/my-listings', label: 'My Listings' },
    { to: '/create-listing', label: 'Post Property' },
    { to: '/contact', label: 'Contact' },
  ]

  const isOwnerOrBuilder = isAuthenticated() && (user?.role === 'owner' || user?.role === 'builder');
  const navLinks = isOwnerOrBuilder ? authLinks : publicLinks

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-nav' : 'bg-transparent dark:bg-navy-950/50'}`}>
      <div className="w-full px-4 md:px-8 lg:px-12 mx-auto">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img src="/images/logo.png" alt="SocialEstate Logo" className="w-10 h-10 object-contain" />
            <span className="font-display font-bold text-xl tracking-tight transition-colors text-navy-900 dark:text-white">
              Social<span className="text-primary-600">Estate</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-navy-900 dark:text-gray-200 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`
                }>{l.label}</NavLink>
            ))}
          </div>

          {/* CTA & User */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated() ? (
              <>
                {isAdmin() && (
                  <Link to="/admin" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10">Admin</Link>
                )}

                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 hover:text-navy-900 dark:hover:text-white transition-colors relative"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>

                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-2 text-gray-500 hover:text-navy-900 transition-colors relative"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notifications.length > 0 && (
                      <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                  </button>
                  
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-card-hover border border-gray-100 py-1.5 animate-slide-down overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <p className="text-sm font-bold text-navy-900">Notifications</p>
                        <span className="text-xs bg-navy-100 text-navy-800 px-2 py-0.5 rounded-full font-semibold">{notifications.length}</span>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 10).map((n) => (
                            <div key={n.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3">
                              <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.color}`}></div>
                              <div>
                                <p className="text-xs font-bold text-navy-900">{n.title}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.desc}</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                  {formatDistanceToNow(n.date, { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-500 text-xs">
                            No notifications yet
                          </div>
                        )}
                      </div>
                      <Link to="/dashboard" onClick={() => setNotifOpen(false)} className="block w-full text-center px-4 py-2 text-xs font-semibold text-primary-500 hover:bg-primary-50 transition-colors bg-gray-50/50 border-t border-gray-100">
                        View All Activity
                      </Link>
                    </div>
                  )}
                </div>
                <div className="relative" ref={dropRef}>
                  <button onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 p-1 rounded-full transition-colors hover:bg-navy-50">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-primary-200">
                        <span className="text-primary-700 text-xs font-bold">{initials(user?.fullName)}</span>
                      </div>
                    )}
                  </button>
                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card-hover border border-gray-100 py-1.5 animate-slide-down overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-navy-50/50">
                        <p className="text-sm font-semibold text-navy-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition-colors" onClick={() => setDropOpen(false)}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
                        Dashboard
                      </Link>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition-colors" onClick={() => setDropOpen(false)}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Profile
                      </Link>
                      <div className="border-t border-gray-100 mt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Theme Toggle (Guest) */}
                <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-navy-900 dark:hover:text-white transition-colors">
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
                <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors text-navy-900 dark:text-gray-200 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">Login</Link>
                <Link to="/register?role=owner"
                  onClick={() => toast('Please create an account or login to post your property.', { icon: '' })}
                  className="bg-accent-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-600 transition-all inline-flex items-center gap-2 shadow-sm hover:shadow-md">
                  Post Property
                  {/* <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">FREE</span> */}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden p-2 rounded-lg transition-colors text-navy-900 dark:text-gray-200 hover:bg-navy-50 dark:hover:bg-navy-800" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <div className="w-5 space-y-1.5">
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="py-4 border-t border-gray-100">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium rounded-lg transition-colors text-navy-900 dark:text-gray-200 hover:bg-navy-50 dark:hover:bg-navy-800">
                {l.label}
              </NavLink>
            ))}
            <div className="mt-4 flex flex-col gap-2 px-2">
              {isAuthenticated() ? (
                <>
                  {(user?.role === 'owner' || user?.role === 'builder') && (
                    <Link to="/create-listing" onClick={() => setMenuOpen(false)}
                      className="bg-accent-500 text-white text-center py-2.5 rounded-lg font-semibold text-sm">Post Property FREE</Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-center text-sm text-red-500 py-2.5 font-medium">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="btn-outline text-center justify-center">Login</Link>
                  <Link to="/register?role=owner" 
                    onClick={() => { setMenuOpen(false); toast('Please create an account or login to post your property.', { icon: '' }); }}
                    className="bg-accent-500 text-white text-center py-2.5 rounded-lg font-semibold text-sm">Post Property FREE</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
