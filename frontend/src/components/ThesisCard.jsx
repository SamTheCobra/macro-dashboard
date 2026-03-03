import { useNavigate } from 'react-router-dom'
import HealthScoreBadge from './HealthScoreBadge'
import { fmtDate, convictionColor, statusColor, compatBadge } from '../utils/formatters'
import { AlertTriangle, TrendingUp, Clock, ChevronRight } from 'lucide-react'

export default function ThesisCard({ thesis, compat }) {
  const navigate = useNavigate()
  const cb = compatBadge(compat)
  const triggeredInvalidations = thesis.triggered_invalidations || 0

  return (
    <div
      onClick={() => navigate(`/thesis/${thesis.id}`)}
      className="card-hover group relative"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-terminal-text group-hover:text-terminal-green transition-colors truncate">
            {thesis.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {thesis.sector && (
              <span className="badge-dim text-xs">
                {thesis.sector}
              </span>
            )}
            {thesis.time_horizon && (
              <span className="flex items-center gap-1 text-xs text-terminal-dim">
                <Clock size={10} />
                {thesis.time_horizon}
              </span>
            )}
          </div>
        </div>
        <HealthScoreBadge score={thesis.health_score} />
      </div>

      {/* Regime badge */}
      {compat && (
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mb-3"
          style={{ color: cb.color, backgroundColor: cb.bg, border: `1px solid ${cb.color}30` }}
        >
          {cb.text}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center py-2 rounded bg-terminal-muted/50">
          <div className="text-terminal-dim text-[10px] uppercase tracking-wider">Conviction</div>
          <div
            className="text-lg font-bold leading-tight mt-0.5"
            style={{ color: convictionColor(thesis.latest_conviction || 0) }}
          >
            {thesis.latest_conviction ?? '—'}
          </div>
        </div>
        <div className="text-center py-2 rounded bg-terminal-muted/50">
          <div className="text-terminal-dim text-[10px] uppercase tracking-wider">Bets</div>
          <div className="text-lg font-bold text-terminal-text leading-tight mt-0.5">
            {thesis.active_bet_count}
          </div>
        </div>
        <div className="text-center py-2 rounded bg-terminal-muted/50">
          <div className="text-terminal-dim text-[10px] uppercase tracking-wider">Confidence</div>
          <div className="text-lg font-bold text-terminal-text leading-tight mt-0.5">
            {thesis.confidence_level}<span className="text-xs text-terminal-dim">/10</span>
          </div>
        </div>
      </div>

      {/* Invalidation alert */}
      {triggeredInvalidations > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-terminal-red/8 border border-terminal-red/20 mb-2">
          <AlertTriangle size={12} className="text-terminal-red shrink-0" />
          <span className="text-xs text-terminal-red">
            {triggeredInvalidations} invalidation{triggeredInvalidations > 1 ? 's' : ''} triggered
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-terminal-border">
        <span className="text-xs text-terminal-dim">
          Since {fmtDate(thesis.activation_date)}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: statusColor(thesis.status) }}
          >
            {thesis.status.toUpperCase()}
          </span>
          <ChevronRight size={14} className="text-terminal-dim group-hover:text-terminal-green transition-colors" />
        </div>
      </div>
    </div>
  )
}
