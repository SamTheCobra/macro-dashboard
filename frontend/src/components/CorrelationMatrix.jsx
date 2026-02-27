import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { getCorrelation } from '../utils/api'
import { AlertTriangle } from 'lucide-react'

export default function CorrelationMatrix() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCorrelation()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="card animate-pulse h-72" />
  }

  if (!data || !data.tickers || data.tickers.length < 2) {
    return (
      <div className="card flex items-center justify-center h-48 text-terminal-dim text-sm">
        Need at least 2 active bets with tickers to compute correlation.
      </div>
    )
  }

  const { tickers, matrix, crowding_warnings } = data

  // Color scale: red (negative) → gray → green (positive)
  const heatmapData = [
    {
      z: matrix,
      x: tickers,
      y: tickers,
      type: 'heatmap',
      colorscale: [
        [0, '#ef4444'],
        [0.5, '#1c2333'],
        [1, '#00ff88'],
      ],
      zmin: -1,
      zmax: 1,
      text: matrix.map(row => row.map(v => v.toFixed(2))),
      texttemplate: '%{text}',
      textfont: { family: 'JetBrains Mono', size: 11, color: '#e6edf3' },
      showscale: true,
      colorbar: {
        tickfont: { color: '#8b949e', family: 'JetBrains Mono', size: 10 },
        thickness: 12,
      },
      hovertemplate: '%{y} vs %{x}<br>Corr: %{z:.3f}<extra></extra>',
    },
  ]

  return (
    <div>
      <div className="section-title">Return Correlation Matrix</div>

      <Plot
        data={heatmapData}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { t: 10, r: 80, b: 60, l: 60 },
          xaxis: {
            color: '#8b949e',
            tickfont: { size: 11, family: 'JetBrains Mono' },
          },
          yaxis: {
            color: '#8b949e',
            tickfont: { size: 11, family: 'JetBrains Mono' },
          },
          hoverlabel: {
            bgcolor: '#0d1117',
            bordercolor: '#1c2333',
            font: { color: '#e6edf3', family: 'JetBrains Mono', size: 11 },
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: 320 }}
      />

      {crowding_warnings?.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="section-title text-terminal-amber">Crowding Risk Warnings</div>
          {crowding_warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded border"
              style={{
                borderColor: w.risk_level === 'high' ? '#ef444440' : '#f59e0b40',
                backgroundColor: w.risk_level === 'high' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
              }}
            >
              <AlertTriangle size={13}
                style={{ color: w.risk_level === 'high' ? '#ef4444' : '#f59e0b' }}
              />
              <span className="text-sm text-terminal-text font-medium">
                {w.ticker_a} ↔ {w.ticker_b}
              </span>
              <span className="text-xs text-terminal-dim ml-auto">
                corr = {w.correlation}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded uppercase"
                style={{
                  color: w.risk_level === 'high' ? '#ef4444' : '#f59e0b',
                  backgroundColor: w.risk_level === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                }}
              >
                {w.risk_level}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
