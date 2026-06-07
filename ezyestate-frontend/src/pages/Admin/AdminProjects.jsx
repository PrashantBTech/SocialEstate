import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getAllProjects, approveProject, rejectProject } from '@/api/adminApi'
import { formatDate, statusColor } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'

export default function AdminProjects() {
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', statusFilter, page],
    queryFn: () => getAllProjects({ status: statusFilter || undefined, page, limit: 20 }),
    select: d => d.data.data,
    keepPreviousData: true,
  })

  const approve = useMutation({
    mutationFn: (id) => approveProject(id),
    onSuccess: () => { toast.success('Project approved!'); queryClient.invalidateQueries(['admin-projects']) },
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }) => rejectProject(id, { reason }),
    onSuccess: () => { toast.success('Project rejected.'); queryClient.invalidateQueries(['admin-projects']) },
  })

  const STATUS_TABS = [
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'active', label: 'Active' },
    { value: 'rejected', label: 'Rejected' },
    { value: '', label: 'All' },
  ]

  return (
    <>
      <Helmet><title>Builder Projects | Admin — SocialEstate</title></Helmet>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">Builder Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.pagination?.total || 0} total projects</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === tab.value ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary-50'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div className="admin-card overflow-hidden p-0">
        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Project</th>
                  <th className="table-th">Builder</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">RERA</th>
                  <th className="table-th">Units</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Fee</th>
                  <th className="table-th">Submitted</th>
                  <th className="table-th text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.projects?.length > 0 ? data.projects.map(project => (
                  <tr key={project._id} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        {project.bannerImage || project.images?.[0]?.url ? (
                          <img src={project.bannerImage || project.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-base flex-shrink-0">�️</div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-primary-800">{project.projectName}</p>
                          <p className="text-xs text-gray-400 capitalize">{project.projectStatus?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <p className="text-sm text-gray-700">{project.companyName}</p>
                      <p className="text-xs text-gray-400">{project.builder?.mobile}</p>
                    </td>
                    <td className="table-td">
                      <p className="text-sm text-gray-700">{project.location?.city}</p>
                      <p className="text-xs text-gray-400">{project.location?.state}</p>
                    </td>
                    <td className="table-td text-sm text-gray-600 capitalize">{project.projectType}</td>
                    <td className="table-td">
                      {project.reraNumber
                        ? <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">✓ RERA</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="table-td text-center">
                      <p className="text-sm font-medium text-primary-700">{project.availableUnits || 0}</p>
                      <p className="text-xs text-gray-400">/ {project.totalUnits || 0}</p>
                    </td>
                    <td className="table-td">
                      <span className={`badge border text-xs ${statusColor(project.status)}`}>{project.status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="table-td">
                      {project.serviceFee?.status === 'paid'
                        ? <span className="text-xs text-emerald-600 font-medium">✓ Paid</span>
                        : <span className="text-xs text-red-500">✗ Pending</span>}
                    </td>
                    <td className="table-td text-xs text-gray-500">{formatDate(project.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex gap-1.5 justify-center">
                        {project.status === 'pending_review' && project.serviceFee?.status === 'paid' && (
                          <button onClick={() => approve.mutate(project._id)} disabled={approve.isPending}
                            className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                            ✓ Approve
                          </button>
                        )}
                        {project.status === 'pending_review' && (
                          <button onClick={() => {
                            const r = prompt('Rejection reason:')
                            if (r) reject.mutate({ id: project._id, reason: r })
                          }} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100">
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">No projects found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {data?.pagination && (
          <div className="p-4 border-t border-gray-50">
            <Pagination page={page} total={data.pagination.total} limit={20} onPageChange={setPage} />
          </div>
        )}
      </div>
    </>
  )
}
