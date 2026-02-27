import { useNavigate } from 'react-router-dom'
import HealthScoreBadge from './HealthScoreBadge'
import { fmtDate, convictionColor, statusColor, compatBadge } from '../utils/formatters'
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'

export default function ThesisCard({ thesis, compat }) {
  const navigate = useNavigate()
  const cb = compatBadge(compat)

  const triggeredInvalidations = thesis.triggered_invalidations || 0

  return (
    <div
      onClick={() => navigate(`/thesis/${thesis.id}`)}
      className="card cursor-pointer hover:border-terminal-green/40 transition-all duration-200 hover:shadow-glow group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-terminal-text group-hover:text-terminal-green transition-colors truncate">
            {thesis.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {thesis.sector && (
              <span className="badge bg-terminal-muted text-terminal-dim text-xs">
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

      {/* Regime compat */}
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
        <div className="text-center">
          <div className="text-terminal-dim text-xs uppercase">Conviction</div>
          <div
            className="text-lg font-bold"
            style={{ color: convictionColor(thesis.latest_conviction || 0) }}
          >
            {thesis.latest_conviction ?? '—'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-terminal-dim text-xs uppercase">Active Bets</div>
          <div className="text-lg font-bold text-terminal-text">
            {thesis.active_bet_count}
          </div>
        </div>
        <div className="text-center">
          <div className="text-terminal-dim text-xs uppercase">Confidence</div>
          <div className="text-lg font-bold text-terminal-text">
            {thesis.confidence_level}<span className="text-xs text-terminal-dim">/10</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {triggeredInvalidations > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20 mb-2">
          <AlertTriangle size={12} className="text-terminal-red shrink-0" />
          <span className="text-xs text-terminal-red">
            {triggeredInvalidations} invalidation{triggeredInvalidations > 1 ? 's' : ''} triggered
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-terminal-border">
        <span className="text-xs text-terminal-dim">
          Since {fmtDate(thesis.activation_date)}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: statusColor(thesis.status) }}
        >
          {thesis.status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
