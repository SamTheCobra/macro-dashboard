import { useState } from 'react'
import { updateBet, deleteBet } from '../utils/api'
import { fmtPrice, fmtPct, statusColor } from '../utils/formatters'
import { Trash2, Edit3, CheckCircle } from 'lucide-react'
import BetModal from './modals/BetModal'

export default function BetsTable({ thesisId, bets = [], onRefresh }) {
  const [editBet, setEditBet] = useState(null)

  const handleDelete = async (betId) => {
    if (!confirm('Delete this bet?')) return
    await deleteBet(betId)
    onRefresh()
  }

  const pnl = (bet) => {
    if (!bet.current_price || !bet.entry_price) return null
    return ((bet.current_price - bet.entry_price) / bet.entry_price) * 100
  }

  if (!bets.length) {
    return (
      <div className="text-center py-8 text-terminal-dim text-sm">
        No bets yet.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-terminal-border">
              {['Name', 'Ticker', 'Entry', 'Current', 'Target', 'Stop', 'P&L', 'Size%', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs text-terminal-dim uppercase tracking-wider px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {bets.map(bet => {
              const p = pnl(bet)
              return (
                <tr key={bet.id} className="hover:bg-terminal-muted/30 transition-colors">
                  <td className="px-2 py-2.5 text-terminal-text font-medium max-w-[160px] truncate">
                    {bet.name}
                  </td>
                  <td className="px-2 py-2.5 text-terminal-green font-mono">
                    {bet.ticker || '—'}
                  </td>
                  <td className="px-2 py-2.5 text-terminal-dim">{fmtPrice(bet.entry_price)}</td>
                  <td className="px-2 py-2.5 text-terminal-text">{fmtPrice(bet.current_price)}</td>
                  <td className="px-2 py-2.5 text-terminal-green">{fmtPrice(bet.target_price)}</td>
                  <td className="px-2 py-2.5 text-terminal-red">{fmtPrice(bet.stop_price)}</td>
                  <td className="px-2 py-2.5">
                    {p !== null ? (
                      <span style={{ color: p >= 0 ? '#00ff88' : '#ef4444' }}>
                        {fmtPct(p)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-2 py-2.5 text-terminal-dim">
                    {bet.position_size_pct != null ? `${bet.position_size_pct}%` : '—'}
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        color: statusColor(bet.status),
                        backgroundColor: `${statusColor(bet.status)}15`,
                      }}
                    >
                      {bet.status}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditBet(bet)}
                        className="text-terminal-dim hover:text-terminal-text"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(bet.id)}
                        className="text-terminal-dim hover:text-terminal-red"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Scenario table */}
      {bets.some(b => b.scenarios?.length > 0) && (
        <div className="mt-4">
          <div className="section-title">Scenario Models</div>
          <div className="space-y-3">
            {bets.filter(b => b.scenarios?.length > 0).map(bet => (
              <div key={bet.id} className="card-sm">
                <div className="text-xs text-terminal-text font-medium mb-2">
                  {bet.name} {bet.ticker && <span className="text-terminal-green">({bet.ticker})</span>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {bet.scenarios.map(sc => (
                    <div
                      key={sc.id}
                      className="p-2 rounded"
                      style={{
                        backgroundColor:
                          sc.scenario_type === 'bull' ? 'rgba(0,255,136,0.05)' :
                          sc.scenario_type === 'bear' ? 'rgba(239,68,68,0.05)' :
                          'rgba(245,158,11,0.05)',
                        borderLeft: `2px solid ${
                          sc.scenario_type === 'bull' ? '#00ff88' :
                          sc.scenario_type === 'bear' ? '#ef4444' : '#f59e0b'
                        }`,
                      }}
                    >
                      <div className="text-xs font-medium uppercase mb-1"
                        style={{
                          color: sc.scenario_type === 'bull' ? '#00ff88' :
                                 sc.scenario_type === 'bear' ? '#ef4444' : '#f59e0b'
                        }}
                      >
                        {sc.scenario_type}
                      </div>
                      <div className="text-sm font-bold text-terminal-text">
                        {sc.expected_return_pct > 0 ? '+' : ''}{sc.expected_return_pct}%
                      </div>
                      <div className="text-xs text-terminal-dim">
                        p={Math.round(sc.probability * 100)}%
                      </div>
                      {sc.notes && (
                        <div className="text-xs text-terminal-dim mt-1 line-clamp-2">{sc.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Expected value */}
                {bet.scenarios.length === 3 && (() => {
                  const ev = bet.scenarios.reduce((sum, s) => sum + s.expected_return_pct * s.probability, 0)
                  return (
                    <div className="mt-2 text-xs text-terminal-dim">
                      Expected Value: <span className="text-terminal-text font-medium">
                        {ev > 0 ? '+' : ''}{ev.toFixed(1)}%
                      </span>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {editBet && (
        <BetModal
          thesisId={thesisId}
          bet={editBet}
          onClose={() => setEditBet(null)}
          onSaved={() => { setEditBet(null); onRefresh() }}
        />
      )}
    </>
  )
}
