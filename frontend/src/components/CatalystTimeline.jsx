import { useState } from 'react'
import { fmtDate } from '../utils/formatters'
import { deleteCatalyst, updateCatalyst } from '../utils/api'
import { Calendar, Trash2, CheckCircle, ChevronRight } from 'lucide-react'
import CatalystModal from './modals/CatalystModal'

const TYPE_COLORS = {
  fed: '#8b5cf6',
  election: '#3b82f6',
  earnings: '#00ff88',
  regulatory: '#f59e0b',
  other: '#8b949e',
}

const TYPE_LABELS = {
  fed: 'FED',
  election: 'ELECTION',
  earnings: 'EARNINGS',
  regulatory: 'REGULATORY',
  other: 'EVENT',
}

export default function CatalystTimeline({ thesisId, catalysts = [], onRefresh }) {
  const [showModal, setShowModal] = useState(false)

  const sorted = [...catalysts].sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
  const now = new Date()
  const upcoming = sorted.filter(c => new Date(c.event_date) >= now)
  const past = sorted.filter(c => new Date(c.event_date) < now)

  const handleDelete = async (id) => {
    if (!confirm('Delete this catalyst?')) return
    await deleteCatalyst(id)
    onRefresh()
  }

  const CatalystItem = ({ cat }) => {
    const color = TYPE_COLORS[cat.event_type] || '#8b949e'
    const label = TYPE_LABELS[cat.event_type] || 'EVENT'
    const isPast = new Date(cat.event_date) < now

    return (
      <div className={`flex gap-3 ${isPast ? 'opacity-60' : ''}`}>
        <div className="flex flex-col items-center">
          <div
            className="w-3 h-3 rounded-full border-2 shrink-0 mt-0.5"
            style={{
              borderColor: color,
              backgroundColor: cat.outcome ? color : 'transparent',
            }}
          />
          <div className="flex-1 w-px bg-terminal-border mt-1" style={{ minHeight: 20 }} />
        </div>
        <div className="pb-4 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ color, backgroundColor: `${color}15` }}
              >
                {label}
              </span>
              <span className="text-sm text-terminal-text font-medium">
                {cat.event_name}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-terminal-dim">{fmtDate(cat.event_date)}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-terminal-dim hover:text-terminal-red"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          {cat.description && (
            <div className="text-xs text-terminal-dim mb-1">{cat.description}</div>
          )}
          {cat.outcome && (
            <div className="text-xs px-2 py-1 rounded bg-terminal-muted border border-terminal-border">
              <span className="text-terminal-green">Outcome: </span>
              <span className="text-terminal-text">{cat.outcome}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0">Catalyst Calendar</div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-secondary text-xs"
        >
          + Add Catalyst
        </button>
      </div>

      {!catalysts.length ? (
        <div className="flex flex-col items-center py-8 text-terminal-dim">
          <Calendar size={24} className="mb-2 opacity-30" />
          <div className="text-sm">No catalysts added yet.</div>
        </div>
      ) : (
        <div>
          {upcoming.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-terminal-green uppercase tracking-wider mb-3">
                Upcoming ({upcoming.length})
              </div>
              {upcoming.map(cat => <CatalystItem key={cat.id} cat={cat} />)}
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-xs text-terminal-dim uppercase tracking-wider mb-3">
                Past ({past.length})
              </div>
              {past.map(cat => <CatalystItem key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CatalystModal
          thesisId={thesisId}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); onRefresh() }}
        />
      )}
    </div>
  )
}
