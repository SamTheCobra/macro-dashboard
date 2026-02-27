import Plot from 'react-plotly.js'
import { fmtDate, tagColor, tagLabel } from '../utils/formatters'

export default function ConvictionChart({ entries = [], activationDate }) {
  if (!entries.length) {
    return (
      <div className="flex items-center justify-center h-48 text-terminal-dim text-sm">
        No conviction entries yet.
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
  const dates = sorted.map(e => e.date)
  const scores = sorted.map(e => e.conviction_score)
  const tags = sorted.map(e => e.tag)
  const texts = sorted.map(e =>
    `${fmtDate(e.date)}<br><b>Score: ${e.conviction_score}/10</b><br>${tagLabel(e.tag)}<br>${e.note}`
  )

  // Color each point by tag
  const markerColors = tags.map(t => tagColor(t))

  const data = [
    {
      x: dates,
      y: scores,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Conviction',
      line: { color: '#00ff88', width: 2, shape: 'spline' },
      marker: { color: markerColors, size: 10, line: { width: 2, color: '#080b10' } },
      text: texts,
      hovertemplate: '%{text}<extra></extra>',
      fill: 'tozeroy',
      fillcolor: 'rgba(0,255,136,0.05)',
    },
  ]

  const shapes = []
  if (activationDate) {
    shapes.push({
      type: 'line',
      x0: activationDate, x1: activationDate,
      y0: 0, y1: 10,
      line: { color: '#f59e0b', width: 1, dash: 'dot' },
    })
  }

  return (
    <Plot
      data={data}
      layout={{
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 10, r: 20, b: 40, l: 40 },
        xaxis: {
          color: '#8b949e',
          gridcolor: '#1c2333',
          tickfont: { size: 10, family: 'JetBrains Mono' },
        },
        yaxis: {
          color: '#8b949e',
          gridcolor: '#1c2333',
          range: [0, 10.5],
          tickfont: { size: 10, family: 'JetBrains Mono' },
          tickvals: [0, 2, 4, 6, 8, 10],
        },
        shapes,
        showlegend: false,
        hoverlabel: {
          bgcolor: '#0d1117',
          bordercolor: '#1c2333',
          font: { color: '#e6edf3', family: 'JetBrains Mono', size: 11 },
        },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 220 }}
    />
  )
}
