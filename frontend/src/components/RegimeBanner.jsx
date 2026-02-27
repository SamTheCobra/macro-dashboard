import { useEffect, useState } from 'react'
import { getCurrentRegime } from '../utils/api'
import { Activity } from 'lucide-react'

const INDICATOR_LABELS = {
  fed_rate: 'FED FUNDS',
  cpi: 'CPI',
  ten_year: '10Y YIELD',
  two_year: '2Y YIELD',
  spread_10_2: '10Y-2Y',
  hy_spread: 'HY SPREAD',
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
      <div className="border-b border-terminal-border px-6 py-3 animate-pulse">
        <div className="h-4 w-64 bg-terminal-muted rounded" />
      </div>
    )
  }

  if (!regime) return null

  const ind = regime.indicators || {}
  const displayKeys = ['fed_rate', 'cpi', 'ten_year', 'spread_10_2', 'vix', 'spy_30d']

  return (
    <div
      className="border-b border-terminal-border px-6 py-2 flex items-center gap-6 flex-wrap"
      style={{ borderLeftColor: regime.color, borderLeftWidth: 3 }}
    >
      {/* Regime pill */}
      <div className="flex items-center gap-2 shrink-0">
        <Activity size={13} style={{ color: regime.color }} />
        <span className="text-xs text-terminal-dim uppercase tracking-wider">Regime:</span>
        <span
          className="text-sm font-bold tracking-wider uppercase px-2 py-0.5 rounded"
          style={{ color: regime.color, backgroundColor: `${regime.color}18` }}
        >
          {regime.label}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded border"
          style={{ color: regime.color, borderColor: `${regime.color}40` }}
        >
          {regime.confidence?.toUpperCase()}
        </span>
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-4 flex-wrap">
        {displayKeys.map((key) => {
          const val = ind[key]
          if (val === null || val === undefined) return null
          const label = INDICATOR_LABELS[key] || key
          const isReturn = key === 'spy_30d'
          const color = isReturn ? (val >= 0 ? '#00ff88' : '#ef4444') : '#8b949e'
          const formatted = isReturn ? `${val > 0 ? '+' : ''}${val?.toFixed(1)}%` : val?.toFixed(2)
          return (
            <div key={key} className="flex items-center gap-1">
              <span className="text-xs text-terminal-dim">{label}</span>
              <span className="text-xs font-medium" style={{ color }}>
                {formatted}
              </span>
            </div>
          )
        })}
      </div>

      {/* Description */}
      <div className="hidden xl:block text-xs text-terminal-dim ml-auto max-w-xs truncate">
        {regime.description}
      </div>
    </div>
  )
}
