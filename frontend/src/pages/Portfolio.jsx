import { useEffect, useState } from 'react'
import { getPortfolioOverview, getPortfolioExposure, getAllBets } from '../utils/api'
import CorrelationMatrix from '../components/CorrelationMatrix'
import PositionCalc from '../components/PositionCalc'
import RegimeBanner from '../components/RegimeBanner'
import Plot from 'react-plotly.js'
import { fmtPrice, fmtPct, statusColor } from '../utils/formatters'
import { useNavigate } from 'react-router-dom'

export default function Portfolio() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [exposure, setExposure] = useState(null)
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getPortfolioOverview().catch(() => null),
      getPortfolioExposure().catch(() => null),
      getAllBets().catch(() => []),
    ]).then(([ov, exp, bs]) => {
      setOverview(ov)
      setExposure(exp)
      setBets(bs)
    }).finally(() => setLoading(false))
  }, [])

  const sectorData = exposure?.by_sector
    ? Object.entries(exposure.by_sector).sort((a, b) => b[1] - a[1])
    : []

  return (
    <div className="flex flex-col h-full">
      <RegimeBanner />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <h1 className="text-lg font-bold text-terminal-text">Portfolio Overview</h1>

        {/* Stats bar */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Total Theses', overview.total_theses, '#8b949e'],
              ['Active Theses', overview.active_theses, '#00ff88'],
              ['Active Bets', overview.total_active_bets, '#3b82f6'],
              ['Avg Health', `${overview.avg_health_score}/100`, overview.avg_health_score >= 70 ? '#00ff88' : '#f59e0b'],
            ].map(([label, val, color]) => (
              <div key={label} className="card">
                <div className="text-xs text-terminal-dim mb-1">{label}</div>
                <div className="text-2xl font-bold" style={{ color }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sector exposure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="section-title">Sector Exposure</div>
            {sectorData.length > 0 ? (
              <>
                <Plot
                  data={[{
                    type: 'bar',
                    orientation: 'h',
                    y: sectorData.map(([k]) => k),
                    x: sectorData.map(([, v]) => v),
                    marker: { color: '#00ff88', opacity: 0.7 },
                    hovertemplate: '%{y}<br><b>%{x:.1f}%</b><extra></extra>',
                  }]}
                  layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    margin: { t: 10, r: 20, b: 30, l: 200 },
                    xaxis: { color: '#8b949e', gridcolor: '#1c2333', tickfont: { size: 10, family: 'JetBrains Mono' }, title: 'Position %' },
                    yaxis: { color: '#8b949e', tickfont: { size: 10, family: 'JetBrains Mono' }, automargin: true },
                    hoverlabel: { bgcolor: '#0d1117', bordercolor: '#1c2333', font: { color: '#e6edf3', family: 'JetBrains Mono' } },
                  }}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: '100%', height: 240 }}
                />
              </>
            ) : (
              <div className="text-terminal-dim text-sm py-4">No active positions with size data.</div>
            )}
          </div>

          <PositionCalc />
        </div>

        {/* Correlation matrix */}
        <div className="card">
          <CorrelationMatrix />
        </div>

        {/* All bets table */}
        <div className="card">
          <div className="section-title">All Active & Watching Bets</div>
          {bets.length === 0 ? (
            <div className="text-terminal-dim text-sm py-4">No bets yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-terminal-border">
                    {['Thesis', 'Bet', 'Ticker', 'Entry', 'Current', 'Target', 'P&L', 'Size%', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs text-terminal-dim uppercase tracking-wider px-2 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border">
                  {bets.map(bet => (
                    <tr
                      key={bet.bet_id}
                      className="hover:bg-terminal-muted/30 cursor-pointer"
                      onClick={() => navigate(`/thesis/${bet.thesis_id}`)}
                    >
                      <td className="px-2 py-2 text-terminal-dim text-xs max-w-[140px] truncate">
                        {bet.thesis_name}
                      </td>
                      <td className="px-2 py-2 text-terminal-text font-medium max-w-[140px] truncate">
                        {bet.bet_name}
                      </td>
                      <td className="px-2 py-2 text-terminal-green font-mono">
                        {bet.ticker || '—'}
                      </td>
                      <td className="px-2 py-2 text-terminal-dim">{fmtPrice(bet.entry_price)}</td>
                      <td className="px-2 py-2 text-terminal-text">{fmtPrice(bet.current_price)}</td>
                      <td className="px-2 py-2 text-terminal-green">{fmtPrice(bet.target_price)}</td>
                      <td className="px-2 py-2">
                        {bet.pnl_pct != null ? (
                          <span style={{ color: bet.pnl_pct >= 0 ? '#00ff88' : '#ef4444' }}>
                            {fmtPct(bet.pnl_pct)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-2 text-terminal-dim">
                        {bet.position_size_pct != null ? `${bet.position_size_pct}%` : '—'}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ color: statusColor(bet.status), backgroundColor: `${statusColor(bet.status)}15` }}
                        >
                          {bet.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-thesis exposure */}
        {exposure?.by_thesis?.length > 0 && (
          <div className="card">
            <div className="section-title">Exposure by Thesis</div>
            <div className="space-y-2">
              {exposure.by_thesis.map(t => (
                <div
                  key={t.thesis_id}
                  className="flex items-center gap-3 hover:bg-terminal-muted/30 px-2 py-2 rounded cursor-pointer"
                  onClick={() => navigate(`/thesis/${t.thesis_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-terminal-text truncate">{t.thesis_name}</div>
                    <div className="text-xs text-terminal-dim">{t.sector} • {t.active_bet_count} bets</div>
                  </div>
                  <div className="text-sm font-medium text-terminal-green">
                    {t.total_position_pct.toFixed(1)}%
                  </div>
                  <div className="w-24 bg-terminal-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, t.total_position_pct * 5)}%`,
                        backgroundColor: '#00ff88',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
