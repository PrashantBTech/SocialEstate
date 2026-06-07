import { Link } from 'react-router-dom'
import { formatPrice } from '@/utils/formatters'

export default function ProjectCard({ project }) {
  if (!project) return null
  const { _id, projectName, companyName, builderLogo, location, projectStatus,
          projectType, images, bannerImage, unitTypes, isFeatured, reraNumber } = project

  const img = bannerImage || images?.[0]?.url
  const minPrice = unitTypes?.length ? Math.min(...unitTypes.map(u => u.startingPrice || Infinity)) : null
  const statusColors = {
    new_launch: 'text-primary-500 bg-primary-500/10 border-primary-500/20',
    under_construction: 'text-navy-500 bg-navy-500/10 border-navy-500/20',
    ready: 'text-white bg-navy-950 border-navy-900',
  }

  return (
    <Link to={`/projects/${_id}`} className="card block overflow-hidden group animate-fade-in">
      <div className="relative h-52 bg-gradient-to-br from-primary-100 to-sand overflow-hidden">
        {img ? (
          <img src={img} alt={projectName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy-100 dark:bg-navy-900">
            <svg className="w-14 h-14 text-navy-300 dark:text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display font-bold text-white text-lg leading-tight">{projectName}</p>
          <p className="text-white/80 text-xs">{companyName}</p>
        </div>
        <div className="absolute top-2 left-2 flex gap-1.5">
          {isFeatured && <span className="badge-feat text-xs">Featured</span>}
          <span className={`badge border text-xs ${statusColors[projectStatus]}`}>
            {projectStatus?.replace('_', ' ')}
          </span>
        </div>
        {reraNumber && (
          <div className="absolute top-2 right-2 bg-navy-950/90 text-[10px] uppercase font-bold tracking-widest text-white px-2.5 py-1 rounded-sm">RERA ✓</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{location?.city}, {location?.state}</p>
            {minPrice && minPrice !== Infinity && (
              <p className="font-display font-semibold text-primary-600">From {formatPrice(minPrice)}</p>
            )}
          </div>
          {builderLogo && (
            <img src={builderLogo} alt={companyName} className="h-8 w-auto object-contain rounded" />
          )}
        </div>
        {unitTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {unitTypes.slice(0, 3).map((u, i) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">{u.bhkType}</span>
            ))}
            {unitTypes.length > 3 && <span className="text-xs text-gray-400">+{unitTypes.length - 3} more</span>}
          </div>
        )}
      </div>
    </Link>
  )
}
