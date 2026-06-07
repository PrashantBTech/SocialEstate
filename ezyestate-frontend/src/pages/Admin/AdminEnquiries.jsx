import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getAllEnquiries, updateEnquiry, logCall } from '@/api/adminApi'
import { formatDate, formatRelative, statusColor } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const ENQUIRY_STATUSES = ['new','contacted','qualified','site_visit_scheduled','deal_in_progress','closed_won','closed_lost','unresponsive']
const CALL_OUTCOMES = ['answered','not_answered','busy','wrong_number','callback_requested']
const CRM_TAGS = ['hot_lead','warm','cold','contacted','not_interested','converted']

function CallModal({ enquiry, onClose, onLog }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-primary-900">Log Call</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="bg-primary-50 rounded-lg p-3 mb-4 text-sm">
          <p className="font-medium text-primary-800">{enquiry?.buyer?.fullName}</p>
          <p className="text-gray-500">{enquiry?.buyer?.mobile}</p>
        </div>
        <form onSubmit={handleSubmit(onLog)} className="space-y-4">
          <div>
            <label className="label">Call Outcome *</label>
            <select {...register('outcome', { required: true })} className="input">
              <option value="">Select outcome</option>
              {CALL_OUTCOMES.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duration (seconds)</label>
            <input {...register('duration')} type="number" className="input" placeholder="e.g. 120" />
          </div>
          <div>
            <label className="label">Notes *</label>
            <textarea {...register('notes', { required: true })} className="input min-h-[80px] resize-none" placeholder="What was discussed?" />
          </div>
          <div>
            <label className="label">Update Status To</label>
            <select {...register('status')} className="input">
              <option value="">Keep current status</option>
              {ENQUIRY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Next Follow-up Date</label>
            <input {...register('followUpDate')} type="datetime-local" className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Log Call
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EnquiryDetailPanel({ enquiry, onClose, onUpdate }) {
  const [tab, setTab] = useState('details')
  if (!enquiry) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-down" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-primary-900">{enquiry.buyer?.fullName}</h3>
            <p className="text-xs text-gray-500">{enquiry.buyer?.mobile}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge border text-xs ${statusColor(enquiry.status)}`}>{enquiry.status?.replace(/_/g, ' ')}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
          </div>
        </div>

        <div className="flex gap-0 border-b border-gray-100 px-5">
          {['details', 'call_logs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.replace('_', ' ')}</button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'details' && (
            <div className="space-y-4">
              {/* Property */}
              <div className="bg-primary-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Interested In</p>
                {enquiry.listing && (
                  <div>
                    <p className="font-medium text-primary-800 capitalize">{enquiry.listing.propertyType?.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{enquiry.listing.location?.city}</p>
                    <p className="text-primary-600 font-semibold text-sm mt-1">{enquiry.listing.askingPrice ? `₹${(enquiry.listing.askingPrice/100000).toFixed(1)}L` : ''}</p>
                  </div>
                )}
                {enquiry.project && (
                  <div>
                    <p className="font-medium text-primary-800">{enquiry.project.projectName}</p>
                    <p className="text-sm text-gray-600">{enquiry.project.location?.city}</p>
                    {enquiry.unitType && <p className="text-xs text-gray-500 mt-1">Unit: {enquiry.unitType}</p>}
                  </div>
                )}
              </div>

              {/* Buyer Info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Mobile', enquiry.buyer?.mobile],
                  ['Email', enquiry.buyer?.email || '—'],
                  ['Enquiry Date', formatDate(enquiry.createdAt)],
                  ['Source', enquiry.source],
                  ['Priority', enquiry.priority],
                  ['Next Follow-up', enquiry.nextFollowUp ? formatDate(enquiry.nextFollowUp) : 'Not set'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Update Status */}
              <div>
                <label className="label">Update Status</label>
                <select defaultValue={enquiry.status} onChange={e => onUpdate(enquiry._id, { status: e.target.value })} className="input">
                  {ENQUIRY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Admin Notes</label>
                <textarea defaultValue={enquiry.notes || ''} onBlur={e => onUpdate(enquiry._id, { notes: e.target.value })}
                  className="input min-h-[80px] resize-none" placeholder="Internal notes about this enquiry..." />
              </div>
            </div>
          )}

          {tab === 'call_logs' && (
            <div className="space-y-3">
              {enquiry.callLogs?.length > 0 ? enquiry.callLogs.map((log, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      log.outcome === 'answered' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'
                    }`}>{log.outcome?.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">{formatRelative(log.calledAt)}</span>
                  </div>
                  {log.duration && <p className="text-xs text-gray-500 mb-1">Duration: {Math.floor(log.duration/60)}m {log.duration%60}s</p>}
                  <p className="text-sm text-gray-700">{log.notes}</p>
                  {log.followUpDate && <p className="text-xs text-primary-600 mt-2">Follow-up: {formatDate(log.followUpDate)}</p>}
                </div>
              )) : (
                <p className="text-center text-sm text-gray-400 py-8">No calls logged yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminEnquiries() {
  const [statusFilter, setStatusFilter] = useState('new')
  const [page, setPage] = useState(1)
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [callTarget, setCallTarget] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-enquiries', statusFilter, page],
    queryFn: () => getAllEnquiries({ status: statusFilter || undefined, page, limit: 20 }),
    select: d => d.data.data,
    keepPreviousData: true,
    refetchInterval: 30000,
  })

  const updateEnq = useMutation({
    mutationFn: ({ id, data }) => updateEnquiry(id, data),
    onSuccess: () => {
      toast.success('Enquiry updated')
      queryClient.invalidateQueries(['admin-enquiries'])
      if (selectedEnquiry) queryClient.invalidateQueries(['admin-enquiries', selectedEnquiry._id])
    },
  })

  const logCallMutation = useMutation({
    mutationFn: ({ id, data }) => logCall(id, data),
    onSuccess: () => {
      toast.success('Call logged successfully!')
      setCallTarget(null)
      queryClient.invalidateQueries(['admin-enquiries'])
    },
  })

  const TABS = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'site_visit_scheduled', label: 'Site Visit' },
    { value: 'deal_in_progress', label: 'Deal' },
    { value: '', label: 'All' },
  ]

  return (
    <>
      <Helmet><title>Enquiries & CRM | Admin — SocialEstate</title></Helmet>

      {callTarget && (
        <CallModal enquiry={callTarget} onClose={() => setCallTarget(null)}
          onLog={(data) => logCallMutation.mutate({ id: callTarget._id, data })} />
      )}

      {selectedEnquiry && (
        <EnquiryDetailPanel enquiry={selectedEnquiry} onClose={() => setSelectedEnquiry(null)}
          onUpdate={(id, data) => updateEnq.mutate({ id, data })} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">Enquiries & CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Manage buyer interest and track follow-ups</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary-50'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div className="admin-card overflow-hidden p-0">
        {isLoading ? <LoadingSpinner text="Loading enquiries..." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Buyer</th>
                  <th className="table-th">Property</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Calls Made</th>
                  <th className="table-th">Next Follow-up</th>
                  <th className="table-th">Received</th>
                  <th className="table-th text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.enquiries?.length > 0 ? data.enquiries.map(enq => (
                  <tr key={enq._id} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                          {enq.buyer?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-800">{enq.buyer?.fullName || '—'}</p>
                          <p className="text-xs text-gray-400">{enq.buyer?.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      {enq.listing && (
                        <div>
                          <p className="text-sm text-gray-700 capitalize">{enq.listing.propertyType?.replace('_',' ')}</p>
                          <p className="text-xs text-gray-400">{enq.listing.location?.city}</p>
                        </div>
                      )}
                      {enq.project && (
                        <div>
                          <p className="text-sm text-gray-700">{enq.project.projectName}</p>
                          <p className="text-xs text-gray-400">{enq.project.location?.city}</p>
                        </div>
                      )}
                    </td>
                    <td className="table-td">
                      <span className={`badge border text-xs ${statusColor(enq.status)}`}>{enq.status?.replace(/_/g,' ')}</span>
                    </td>
                    <td className="table-td">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        enq.priority === 'high' ? 'bg-red-50 text-red-600' :
                        enq.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                      }`}>{enq.priority}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-medium text-primary-700">{enq.callLogs?.length || 0}</span>
                    </td>
                    <td className="table-td">
                      {enq.nextFollowUp ? (
                        <span className={`text-xs ${
                          new Date(enq.nextFollowUp) < new Date() ? 'text-red-500 font-medium' : 'text-gray-600'
                        }`}>{formatDate(enq.nextFollowUp)}</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="table-td text-xs text-gray-500">{formatRelative(enq.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex gap-1.5 justify-center">
                        <button onClick={() => setCallTarget(enq)}
                          className="text-xs bg-primary-500 text-white px-2.5 py-1 rounded-lg hover:bg-primary-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Log Call
                        </button>
                        <button onClick={() => setSelectedEnquiry(enq)}
                          className="text-xs bg-primary-50 text-primary-500 border border-primary-200 px-2.5 py-1 rounded-lg hover:bg-primary-100">Details</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No enquiries found.</td></tr>
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
