export default function Pagination({ page, total, limit, onPageChange }) {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null

  const getPages = () => {
    const arr = []
    const start = Math.max(1, page - 2)
    const end   = Math.min(pages, page + 2)
    if (start > 1) arr.push(1, '...')
    for (let i = start; i <= end; i++) arr.push(i)
    if (end < pages) arr.push('...', pages)
    return arr
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
        className="px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        ← Prev
      </button>
      {getPages().map((p, i) =>
        p === '...' ? <span key={i} className="px-2 text-gray-400">…</span> : (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-primary-500 text-white shadow-cta' : 'border border-gray-200 text-gray-600 hover:bg-primary-50'
            }`}>{p}</button>
        )
      )}
      <button disabled={page === pages} onClick={() => onPageChange(page + 1)}
        className="px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next →
      </button>
    </div>
  )
}
