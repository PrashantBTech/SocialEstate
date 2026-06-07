import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getProjects } from '@/api/projectApi'
import ProjectCard from '@/components/common/ProjectCard'
import Pagination from '@/components/common/Pagination'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export default function ProjectFeed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)

  const filters = {
    city: searchParams.get('city') || '',
    projectStatus: searchParams.get('projectStatus') || '',
    projectType: searchParams.get('projectType') || '',
    page, limit: 12,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters),
    select: d => d.data.data,
    keepPreviousData: true,
  })

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value); else p.delete(key)
    setSearchParams(p); setPage(1)
  }

  return (
    <>
      <Helmet>
        <title>Builder Projects in India | SocialEstate</title>
        <meta name="description" content="Browse verified RERA-registered builder projects across India." />
      </Helmet>
      <div className="pt-16 min-h-screen bg-cream">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-900 to-primary-700 py-10">
          <div className="page-container text-center">
            <h1 className="font-display text-3xl font-bold text-white mb-2">Builder Projects</h1>
            <p className="text-primary-200 text-sm">Verified RERA-registered new launch, under construction & ready-to-move projects</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-primary-100 py-3 sticky top-16 z-30">
          <div className="page-container flex flex-wrap gap-2">
            {[['', 'All Projects'], ['new_launch', 'New Launch'], ['under_construction', 'Under Construction'], ['ready', 'Ready to Move']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter('projectStatus', val)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.projectStatus === val ? 'bg-primary-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-primary-50'
                }`}>{label}</button>
            ))}
            <input value={filters.city} onChange={e => setFilter('city', e.target.value)}
              className="input py-1.5 text-sm w-36 ml-auto" placeholder="Filter by city..." />
          </div>
        </div>

        <div className="page-container py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">{data?.pagination?.total || 0} projects found</p>
          </div>
          {isLoading ? <LoadingSpinner size="lg" text="Loading projects..." /> :
           data?.projects?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {data.projects.map(p => <ProjectCard key={p._id} project={p} />)}
              </div>
              <Pagination page={page} total={data.pagination.total} limit={12} onPageChange={setPage} />
            </>
          ) : (
            <EmptyState 
              icon={
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              } 
              title="No projects found" 
              description="Try removing filters or searching in a different city." 
            />
          )}
        </div>
      </div>
    </>
  )
}
