import { useEffect, useState } from 'react'
import { getCurrentRegime } from '../utils/api'
import { Activity } from 'lucide-react'

const INDICATOR_LABELS = {
  fed_rate: 'FED',
  cpi: 'CPI',
  ten_year: '10Y',
  two_year: '2Y',
  spread_10_2: '10-2',
  hy_spread: 'HY SPD',
  vix: 'VIX',
  spy_30d: 'SPY 30D',
}

export default function RegimeBanner() {
  const [regime, setRegime] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentRegime()
      .then(setRegime)
      .catch(() => setRegime(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="border-b border-terminal-border px-6 py-3">
        <div className="skeleton h-4 w-64" />
      </div>
    )
  }

  if (!regime) return null

  const ind = regime.indicators || {}
  const displayKeys = ['fed_rate', 'cpi', 'ten_year', 'spread_10_2', 'vix', 'spy_30d']

  return (
    <div
      className="border-b border-terminal-border px-6 py-2.5 flex items-center gap-5 flex-wrap bg-terminal-card/30"
      style={{ borderLeftColor: regime.color, borderLeftWidth: 3 }}
    >
      {/* Regime pill */}
      <div className="flex items-center gap-2 shrink-0">
        <Activity size={13} style={{ color: regime.color }} />
        <span
          className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded"
          style={{ color: regime.color, backgroundColor: `${regime.color}15` }}
        >
          {regime.label}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded border"
          style={{ color: regime.color, borderColor: `${regime.color}30` }}
        >
          {regime.confidence?.toUpperCase()}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-terminal-border hidden sm:block" />

      {/* Indicators ticker tape */}
      <div className="flex items-center gap-4 flex-wrap">
        {displayKeys.map((key) => {
          const val = ind[key]
          if (val === null || val === undefined) return null
          const label = INDICATOR_LABELS[key] || key
          const isReturn = key === 'spy_30d'
          const color = isReturn ? (val >= 0 ? '#00ff88' : '#ef4444') : '#e6edf3'
          const formatted = isReturn ? `${val > 0 ? '+' : ''}${val?.toFixed(1)}%` : val?.toFixed(2)
          return (
            <div key={key} className="flex items-center gap-1">
              <span className="text-[10px] text-terminal-dim uppercase">{label}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color }}>
                {formatted}
              </span>
            </div>
          )
        })}
      </div>

      {/* Description */}
      <div className="hidden xl:block text-[10px] text-terminal-dim ml-auto max-w-xs truncate italic">
        {regime.description}
      </div>
    </div>
  )
}
