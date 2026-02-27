import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { getPriceHistory, getFredHistory } from '../utils/api'
import { expectedDirectionLabel } from '../utils/formatters'

export default function ProxyChart({ indicator, activationDate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetcher = indicator.source === 'fred'
      ? getFredHistory(indicator.ticker_or_series_id)
      : getPriceHistory(indicator.ticker_or_series_id)

    fetcher
      .then(d => setData(d))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [indicator.ticker_or_series_id, indicator.source])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 bg-terminal-muted rounded mb-2" />
        <div className="h-32 bg-terminal-muted rounded" />
      </div>
    )
  }

  if (error || !data || !Object.keys(data).length) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-terminal-dim">{indicator.name}</div>
          <span className="badge bg-terminal-muted text-terminal-dim text-xs">
            {indicator.source.toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-terminal-dim italic">
          {error || 'No data available. Check API keys or internet connection.'}
        </div>
      </div>
    )
  }

  const sortedKeys = Object.keys(data).sort()
  const xs = sortedKeys
  const ys = sortedKeys.map(k => data[k])

  const latestVal = ys[ys.length - 1]
  const prevVal = ys[Math.max(0, ys.length - 31)]
  const change30d = prevVal ? ((latestVal - prevVal) / Math.abs(prevVal)) * 100 : 0
  const lineColor = change30d >= 0 ? '#00ff88' : '#ef4444'
  const dirLabel = expectedDirectionLabel(indicator.expected_direction)
  const isAligned =
    (indicator.expected_direction === 'up' && change30d >= 0) ||
    (indicator.expected_direction === 'down' && change30d <= 0) ||
    indicator.expected_direction === 'neutral'

  const shapes = []
  if (activationDate) {
    const actDate = typeof activationDate === 'string'
      ? activationDate.slice(0, 10)
      : activationDate
    shapes.push({
      type: 'line',
      x0: actDate, x1: actDate,
      y0: Math.min(...ys), y1: Math.max(...ys),
      line: { color: '#f59e0b', width: 1, dash: 'dot' },
    })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-terminal-text font-medium">{indicator.name}</span>
          <span className="text-xs text-terminal-dim">{indicator.ticker_or_series_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              color: isAligned ? '#00ff88' : '#ef4444',
              backgroundColor: isAligned ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)',
            }}
          >
            {dirLabel} expected {isAligned ? '✓' : '✗'}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: change30d >= 0 ? '#00ff88' : '#ef4444' }}
          >
            {change30d >= 0 ? '+' : ''}{change30d.toFixed(1)}% 30d
          </span>
        </div>
      </div>

      <Plot
        data={[
          {
            x: xs,
            y: ys,
            type: 'scatter',
            mode: 'lines',
            line: { color: lineColor, width: 1.5 },
            fill: 'tozeroy',
            fillcolor: `${lineColor}08`,
            hovertemplate: '%{x}<br><b>%{y:.4f}</b><extra></extra>',
          },
        ]}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { t: 5, r: 10, b: 25, l: 50 },
          xaxis: {
            color: '#8b949e',
            gridcolor: '#1c2333',
            tickfont: { size: 9, family: 'JetBrains Mono' },
          },
          yaxis: {
            color: '#8b949e',
            gridcolor: '#1c2333',
            tickfont: { size: 9, family: 'JetBrains Mono' },
          },
          shapes,
          showlegend: false,
          hoverlabel: {
            bgcolor: '#0d1117',
            bordercolor: '#1c2333',
            font: { color: '#e6edf3', family: 'JetBrains Mono', size: 10 },
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: 160 }}
      />
    </div>
  )
}
