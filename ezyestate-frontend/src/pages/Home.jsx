import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import SearchBar from '@/components/common/SearchBar'
import PropertyCard from '@/components/common/PropertyCard'
import ProjectCard from '@/components/common/ProjectCard'
import { getListings } from '@/api/listingApi'
import { getProjects } from '@/api/projectApi'

const STATS = [
  {
    label: 'Active Listings', value: '1,200+', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )
  },
  {
    label: 'Registered Builders', value: '80+', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )
  },
  {
    label: 'Cities Covered', value: '32+', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )
  },
  {
    label: 'Deals Closed', value: '500+', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )
  },
]

const SERVICES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: 'We Call Buyers For You',
    desc: 'Our dedicated concierge team proactively reaches out to qualified buyers, ensuring your property gets maximum exposure.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    title: 'Social Media Promotion',
    desc: 'Targeted, high-end campaigns across premium social networks to capture the attention of high-net-worth individuals.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Verified Listings',
    desc: 'Every property is rigorously vetted to maintain the highest standards of trust and professionalism in our network.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Deal Facilitation',
    desc: 'Expert negotiation and seamless transaction management to secure the best possible outcome for your estate.'
  },
]

const PROPERTY_TYPES = [
  {
    label: 'Flats', type: 'flat', desc: 'Apartments & Flats',
    icon: (<svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><rect x="8" y="10" width="32" height="32" rx="3" stroke="currentColor" strokeWidth="2" /><rect x="14" y="16" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" /><rect x="24" y="16" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" /><rect x="14" y="26" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" /><rect x="24" y="26" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" /><rect x="19" y="35" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><line x1="8" y1="42" x2="40" y2="42" stroke="currentColor" strokeWidth="2" /></svg>)
  },
  {
    label: 'Houses', type: 'house', desc: 'Independent Houses',
    icon: (<svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><path d="M6 22L24 8L42 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 20V40H38V20" stroke="currentColor" strokeWidth="2" /><rect x="20" y="30" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="24" width="6" height="5" rx="1" fill="currentColor" opacity="0.2" /><rect x="28" y="24" width="6" height="5" rx="1" fill="currentColor" opacity="0.2" /></svg>)
  },
  {
    label: 'Plots', type: 'plot', desc: 'Land & Plots',
    icon: (<svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><path d="M8 38L14 14L34 10L40 34L8 38Z" fill="currentColor" opacity="0.1" /><path d="M8 38L14 14L34 10L40 34L8 38Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="14" cy="14" r="2" fill="currentColor" /><circle cx="34" cy="10" r="2" fill="currentColor" /><circle cx="40" cy="34" r="2" fill="currentColor" /><circle cx="8" cy="38" r="2" fill="currentColor" /><path d="M20 28V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M16 22L20 18L24 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)
  },
  {
    label: 'Projects', type: 'builder_project', desc: 'New Builder Projects',
    icon: (<svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><rect x="6" y="18" width="16" height="24" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="26" y="8" width="16" height="34" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="10" y="22" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><rect x="10" y="30" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><rect x="30" y="12" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><rect x="34" y="12" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><rect x="30" y="20" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><rect x="34" y="20" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><rect x="30" y="28" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" /><path d="M38 6L42 6L42 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="42" y1="6" x2="42" y2="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" /></svg>)
  },
  {
    label: 'Commercial', type: 'shop', desc: 'Shops & Offices',
    icon: (<svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><rect x="6" y="16" width="36" height="26" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M6 16L10 8H38L42 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M6 16H42" stroke="currentColor" strokeWidth="2" /><rect x="12" y="22" width="10" height="8" rx="1" fill="currentColor" opacity="0.15" /><rect x="26" y="22" width="10" height="8" rx="1" fill="currentColor" opacity="0.15" /><rect x="18" y="34" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><line x1="24" y1="34" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" /></svg>)
  },
  {
    label: 'Farmhouses', type: 'farmhouse', desc: 'Farm & Vacation',
    icon: (<svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><path d="M4 28L16 16L28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="8" y="26" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="32" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><path d="M32 36C32 32 34 28 38 28C42 28 44 32 44 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="38" y1="28" x2="38" y2="40" stroke="currentColor" strokeWidth="2" /><path d="M34 40H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>)
  },
]

export default function Home() {
  const { data: listingsData } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => getListings({ sort: '-propertyScore', limit: 6, status: 'active' }),
    select: d => d.data.data.listings,
    staleTime: 5 * 60 * 1000,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'featured'],
    queryFn: () => getProjects({ sort: '-createdAt', limit: 4 }),
    select: d => d.data.data.projects,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="bg-navy-50 dark:bg-navy-900 transition-colors duration-300">
      <Helmet>
        <title>SocialEstate — Find Your Dream Property in India</title>
        <meta name="description" content="SocialEstate is India's premium real estate platform connecting property owners, builders and buyers. Discover verified listings, new projects and more." />
      </Helmet>

      {/* ===== HERO ===== */}
      <section className="relative min-h-[700px] flex items-center justify-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src="/images/hero_banner.png" alt="Luxury residential township aerial view"
            className="w-full h-full object-cover opacity-90 dark:opacity-50 grayscale contrast-125" />
          <div className="absolute inset-0 bg-navy-950/80 dark:bg-navy-950/95" />
        </div>

        <div className="page-container relative z-10 w-full text-center">
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up">
            <span className="inline-block px-4 py-1.5 border border-primary-500/30 bg-primary-500/10 text-primary-500 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Welcome to the New Era
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              Real Estate Made <br />
              <span className="text-primary-500">Social.</span>
            </h1>
            <p className="text-white/60 text-lg lg:text-xl max-w-2xl mx-auto font-medium">
              We don't just list — we actively connect high-net-worth buyers with premium properties across India.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto animate-fade-in shadow-2xl" style={{ animationDelay: '0.2s' }}>
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative z-20 -mt-16 px-4">
        <div className="page-container">
          <div className="bg-white dark:bg-navy-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-navy-800 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-navy-800">
              {STATS.map(s => (
                <div key={s.label} className="flex flex-col items-center text-center p-8 lg:p-10 group hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                    {s.icon}
                  </div>
                  <p className="font-black text-3xl lg:text-4xl text-navy-950 dark:text-white tracking-tight mb-2">{s.value}</p>
                  <p className="text-xs text-gray-400 dark:text-navy-400 font-bold uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BROWSE BY TYPE ===== */}
      <section className="py-24">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Browse by Property Type</h2>
            <p className="section-subtitle mx-auto">Explore our curated selection of premium real estate categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {PROPERTY_TYPES.map(pt => (
              <Link key={pt.type}
                to={pt.type === 'builder_project' ? '/projects' : `/listings?propertyType=${pt.type}`}
                className="group bg-white dark:bg-navy-950 rounded-2xl p-6 border border-gray-100 dark:border-navy-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-navy-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-full flex items-center justify-center mb-5 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                  {pt.icon}
                </div>
                <p className="text-sm font-bold text-navy-950 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">{pt.label}</p>
                <p className="text-xs text-gray-400 dark:text-navy-400 font-medium">{pt.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED LISTINGS ===== */}
      {listingsData?.length > 0 && (
        <section className="py-24 bg-white dark:bg-navy-950">
          <div className="page-container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="section-title mb-2">Exclusive Properties</h2>
                <p className="section-subtitle">Handpicked premium listings just for you</p>
              </div>
              <Link to="/listings" className="btn-outline hidden sm:inline-flex border-gray-200 text-navy-900 hover:bg-navy-950 hover:text-white dark:border-navy-700 dark:text-white dark:hover:bg-white dark:hover:text-navy-950">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {listingsData.map(l => <PropertyCard key={l._id} listing={l} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== BUILDER PROJECTS ===== */}
      {projectsData?.length > 0 && (
        <section className="py-24">
          <div className="page-container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="section-title mb-2">Signature Projects</h2>
                <p className="section-subtitle">The finest new developments in the country</p>
              </div>
              <Link to="/projects" className="btn-outline hidden sm:inline-flex border-gray-200 text-navy-900 hover:bg-navy-950 hover:text-white dark:border-navy-700 dark:text-white dark:hover:bg-white dark:hover:text-navy-950">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {projectsData.map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY US ===== */}
      <section className="bg-navy-950 dark:bg-navy-900">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 relative min-h-[400px] lg:min-h-[700px] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" 
              alt="Premium luxury villa" 
              className="absolute inset-0 w-full h-full object-cover object-center grayscale contrast-125 opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-navy-950/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end lg:justify-center p-10 lg:p-20">
              <div className="max-w-md">
                <span className="text-primary-500 font-bold tracking-widest uppercase text-sm mb-4 block">The SocialEstate Difference</span>
                <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
                  Beyond <br />
                  Transactions.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  We merge elite digital marketing with premium concierge services to redefine how real estate is traded.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 py-20 px-8 sm:px-12 lg:px-20 flex flex-col justify-center bg-navy-950 dark:bg-navy-900">
            <div className="grid sm:grid-cols-2 gap-10 lg:gap-12">
              {SERVICES.map((s, i) => (
                <div key={s.title} className="group">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-primary-500 mb-6 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                    {s.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-32 bg-primary-500 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="page-container relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tight">
            Ready to Make a Move?
          </h2>
          <p className="text-white/90 text-lg lg:text-xl max-w-2xl mx-auto mb-12 font-medium">
            Join the exclusive network of India's finest property owners and builders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?role=owner"
              className="bg-navy-950 text-white font-bold px-10 py-5 rounded-full hover:bg-black transition-all text-sm uppercase tracking-widest shadow-2xl">
              Post Property
            </Link>
            <Link to="/register?role=builder"
              className="bg-white/10 text-white border-2 border-white/20 font-bold px-10 py-5 rounded-full hover:bg-white hover:text-primary-500 transition-all text-sm uppercase tracking-widest">
              Join as Builder
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
