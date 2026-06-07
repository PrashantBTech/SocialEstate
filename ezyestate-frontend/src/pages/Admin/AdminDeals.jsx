import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getAllDeals, createDeal, updateDeal } from '@/api/adminApi'
import { formatPrice, formatDate, statusColor } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const STAGES = [
  { id: 'lead_received',          label: 'Lead Received',    color: 'bg-gray-100 text-gray-700',    dot: 'bg-gray-400' },
  { id: 'contacted',              label: 'Contacted',        color: 'bg-primary-50 text-primary-600',     dot: 'bg-primary-400' },
  { id: 'site_visit_scheduled',   label: 'Site Visit',       color: 'bg-purple-50 text-purple-700', dot: 'bg-purple-400' },
  { id: 'deal_in_progress',       label: 'Deal In Progress', color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-400' },
  { id: 'closed_won',             label: 'Closed Won',        color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
  { id: 'closed_lost',            label: 'Closed Lost',         color: 'bg-red-50 text-red-700',       dot: 'bg-red-400' },
]

function DealCard({ deal, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [newStage, setNewStage] = useState(deal.stage)
  const [dealValue, setDealValue] = useState(deal.dealValue || '')
  const [commRate, setCommRate] = useState(deal.commissionRate || 3)

  const stage = STAGES.find(s => s.id === deal.stage)

  const handleSave = () => {
    onUpdate(deal._id, {
      stage: newStage,
      dealValue: dealValue ? parseInt(dealValue) : undefined,
      commissionRate: commRate,
    })
    setEditing(false)
  }

  return (
    <div className="admin-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-primary-800">
            {deal.buyer?.fullName || 'Unknown'} ↔ {deal.seller?.fullName || deal.project?.projectName || 'Builder'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {deal.listing ? `${deal.listing.propertyType} · ${deal.listing.location?.city}` : deal.project?.projectName}
          </p>
        </div>
        <span className={`badge border text-xs ${statusColor(deal.stage)} flex-shrink-0`}>{stage?.label}</span>
      </div>

      {deal.dealValue && (
        <div className="flex items-center gap-4 mb-3 bg-primary-50 rounded-lg p-2.5">
          <div className="text-center">
            <p className="text-xs text-gray-500">Deal Value</p>
            <p className="font-display font-bold text-primary-700">{formatPrice(deal.dealValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Commission ({deal.commissionRate}%)</p>
            <p className="font-semibold text-emerald-600">{deal.commissionAmount ? formatPrice(deal.commissionAmount) : '—'}</p>
          </div>
          <div className="text-center ml-auto">
            <p className="text-xs text-gray-500">Commission Status</p>
            <span className={`text-xs font-medium capitalize ${
              deal.commissionStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
            }`}>{deal.commissionStatus}</span>
          </div>
        </div>
      )}

      {editing ? (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Stage</label>
              <select value={newStage} onChange={e => setNewStage(e.target.value)} className="input py-2 text-sm">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Deal Value (₹)</label>
              <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)}
                className="input py-2 text-sm" placeholder="e.g. 2500000" />
            </div>
          </div>
          <div>
            <label className="label">Commission Rate: {commRate}%</label>
            <input type="range" min="1" max="10" step="0.5" value={commRate}
              onChange={e => setCommRate(parseFloat(e.target.value))}
              className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1%</span><span>10%</span></div>
          </div>
          {dealValue && <p className="text-sm text-emerald-600 font-medium">Commission: ₹{((dealValue * commRate) / 100).toLocaleString('en-IN')}</p>}
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-outline flex-1 justify-center text-sm py-2">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center text-sm py-2">Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{formatDate(deal.updatedAt)}</p>
          <div className="flex gap-2">
            {deal.stage !== 'closed_won' && deal.stage !== 'closed_lost' && (
              <button onClick={() => setEditing(true)} className="text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg hover:bg-primary-100 border border-primary-200">Edit Deal</button>
            )}
            {deal.stage !== 'closed_won' && (
              <button onClick={() => onUpdate(deal._id, { stage: 'closed_won' })}
                className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 border border-emerald-200">Mark Won</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDeals() {
  const [stageFilter, setStageFilter] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deals', stageFilter],
    queryFn: () => getAllDeals({ stage: stageFilter || undefined, limit: 50 }),
    select: d => d.data.data,
    refetchInterval: 60000,
  })

  const updateDealMut = useMutation({
    mutationFn: ({ id, data }) => updateDeal(id, data),
    onSuccess: () => {
      toast.success('Deal updated!')
      queryClient.invalidateQueries(['admin-deals'])
      queryClient.invalidateQueries(['admin-dashboard'])
    },
  })

  // Group by stage for pipeline view
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = data?.deals?.filter(d => d.stage === stage.id) || []
    return acc
  }, {})

  const totalRevenue = data?.deals?.filter(d => d.stage === 'closed_won').reduce((s, d) => s + (d.commissionAmount || 0), 0) || 0

  return (
    <>
      <Helmet><title>Deal Pipeline | Admin — SocialEstate</title></Helmet>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">Deal Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Track every deal from lead to closure</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-gray-500">Total Commission Earned</p>
          <p className="font-display font-bold text-emerald-700">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Stage Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {STAGES.map(stage => (
          <button key={stage.id} onClick={() => setStageFilter(stageFilter === stage.id ? '' : stage.id)}
            className={`rounded-xl p-3 text-center border transition-all ${
              stageFilter === stage.id ? 'border-primary-400 shadow-card' : 'border-gray-100 bg-white hover:border-primary-200'
            }`}>
            <span className={`inline-block w-2 h-2 rounded-full ${stage.dot} mb-1.5`} />
            <p className="text-lg font-bold text-primary-800">{dealsByStage[stage.id]?.length || 0}</p>
            <p className="text-xs text-gray-500 leading-tight">{stage.label.replace(' Won','').replace(' Lost','')}</p>
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner text="Loading pipeline..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data?.deals || []).filter(d => !stageFilter || d.stage === stageFilter).map(deal => (
            <DealCard key={deal._id} deal={deal}
              onUpdate={(id, data) => updateDealMut.mutate({ id, data })} />
          ))}
        </div>
      )}

      {data?.deals?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p>No deals in pipeline yet. Create deals from enquiries.</p>
        </div>
      )}
    </>
  )
}
