import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { getAllUsers, updateUser } from '@/api/adminApi'
import { formatDate, formatRelative, initials } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import toast from 'react-hot-toast'

const CRM_TAGS = ['hot_lead','warm','cold','contacted','not_interested','converted']
const CRM_TAG_COLORS = {
  hot_lead: 'bg-red-50 text-red-600 border-red-200',
  warm: 'bg-amber-50 text-amber-600 border-amber-200',
  cold: 'bg-primary-50 text-primary-500 border-primary-200',
  contacted: 'bg-purple-50 text-purple-600 border-purple-200',
  not_interested: 'bg-gray-50 text-gray-500 border-gray-200',
  converted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

function UserDetailModal({ user, onClose, onUpdate }) {
  const [note, setNote] = useState('')
  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg">
              {initials(user.fullName)}
            </div>
            <div>
              <h3 className="font-display font-semibold text-primary-900">{user.fullName}</h3>
              <p className="text-xs text-gray-500 capitalize">{user.role} · Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {[
            ['Mobile', user.mobile],
            ['Email', user.email || '—'],
            ['City', user.location?.city || '—'],
            ['Verified', user.isMobileVerified ? 'Yes ✅' : 'No ❌'],
            ['Last Login', user.lastLogin ? formatRelative(user.lastLogin) : '—'],
            ['CRM Tag', user.crmTag || 'None'],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-medium text-gray-800 capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* CRM Tag */}
        <div className="mb-4">
          <label className="label">CRM Tag</label>
          <div className="flex flex-wrap gap-2">
            {CRM_TAGS.map(tag => (
              <button key={tag} onClick={() => onUpdate(user._id, { crmTag: tag })}
                className={`px-2.5 py-1 rounded-full text-xs border font-medium capitalize transition-colors ${
                  user.crmTag === tag ? CRM_TAG_COLORS[tag] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}>{tag.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Add Note */}
        <div className="mb-4">
          <label className="label">Add Note</label>
          <div className="flex gap-2">
            <input value={note} onChange={e => setNote(e.target.value)} className="input flex-1 py-2 text-sm" placeholder="Add a CRM note..." />
            <button onClick={() => { onUpdate(user._id, { crmNotes: note }); setNote('') }}
              disabled={!note.trim()} className="btn-primary text-sm py-2 px-4">Add</button>
          </div>
        </div>

        {/* Notes History */}
        {user.crmNotes?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Previous Notes</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {[...user.crmNotes].reverse().map((n, i) => (
                <div key={i} className="bg-primary-50 rounded-lg p-2.5">
                  <p className="text-sm text-gray-700">{n.note}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.addedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block / Unblock */}
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Close</button>
          {user.isBlocked ? (
            <button onClick={() => onUpdate(user._id, { isBlocked: false })}
              className="flex-1 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100">
              ✓ Unblock User
            </button>
          ) : (
            <button onClick={() => { const r = prompt('Reason for blocking:'); if (r) onUpdate(user._id, { isBlocked: true, blockedReason: r }) }}
              className="flex-1 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100">
              � Block User
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, tagFilter, page],
    queryFn: () => getAllUsers({ role: roleFilter || undefined, crmTag: tagFilter || undefined, page, limit: 25 }),
    select: d => d.data.data,
    keepPreviousData: true,
  })

  const updateUserMut = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (_, vars) => {
      toast.success('User updated')
      queryClient.invalidateQueries(['admin-users'])
      if (selectedUser?._id === vars.id) {
        queryClient.invalidateQueries(['admin-users'])
      }
    },
  })

  const ROLE_TABS = [{ value: '', label: 'All Users' }, { value: 'buyer', label: '� Buyers' }, { value: 'owner', label: '� Owners' }, { value: 'builder', label: '�️ Builders' }]

  const filteredUsers = (data?.users || []).filter(u =>
    !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.mobile?.includes(search)
  )

  return (
    <>
      <Helmet><title>Users & CRM | Admin — SocialEstate</title></Helmet>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)}
          onUpdate={(id, data) => updateUserMut.mutate({ id, data })} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">Users & CRM</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.pagination?.total || 0} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {ROLE_TABS.map(tab => (
              <button key={tab.value} onClick={() => { setRoleFilter(tab.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  roleFilter === tab.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-primary-50'
                }`}>{tab.label}</button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <select value={tagFilter} onChange={e => { setTagFilter(e.target.value); setPage(1) }} className="input py-1.5 text-xs w-36">
              <option value="">All CRM Tags</option>
              {CRM_TAGS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input py-1.5 text-sm w-44" placeholder="Search name or mobile..." />
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden p-0">
        {isLoading ? <LoadingSpinner text="Loading users..." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Mobile</th>
                  <th className="table-th">City</th>
                  <th className="table-th">CRM Tag</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Last Login</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user._id} className={`border-b border-gray-50 hover:bg-orange-50/20 transition-colors ${user.isBlocked ? 'opacity-60' : ''}`}>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                          {initials(user.fullName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-800">{user.fullName}</p>
                          <p className="text-xs text-gray-400">{user.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        user.role === 'builder' ? 'bg-purple-50 text-purple-700' :
                        user.role === 'owner' ? 'bg-amber-50 text-amber-700' :
                        user.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-600'
                      }`}>{user.role}</span>
                    </td>
                    <td className="table-td text-sm font-mono">{user.mobile}</td>
                    <td className="table-td text-sm text-gray-600">{user.location?.city || '—'}</td>
                    <td className="table-td">
                      {user.crmTag ? (
                        <span className={`badge border text-xs ${CRM_TAG_COLORS[user.crmTag]}`}>{user.crmTag.replace('_', ' ')}</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="table-td">
                      {user.isBlocked
                        ? <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Blocked</span>
                        : user.isMobileVerified
                          ? <span className="text-xs text-emerald-600">✓ Active</span>
                          : <span className="text-xs text-gray-400">Unverified</span>}
                    </td>
                    <td className="table-td text-xs text-gray-500">{user.lastLogin ? formatRelative(user.lastLogin) : '—'}</td>
                    <td className="table-td text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="table-td text-center">
                      <button onClick={() => setSelectedUser(user)} className="text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg hover:bg-primary-100 border border-primary-200">Manage</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {data?.pagination && (
          <div className="p-4 border-t border-gray-50">
            <Pagination page={page} total={data.pagination.total} limit={25} onPageChange={setPage} />
          </div>
        )}
      </div>
    </>
  )
}
