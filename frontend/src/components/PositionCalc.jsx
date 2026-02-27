import { useState } from 'react'
import { fmtPrice } from '../utils/formatters'
import { Calculator } from 'lucide-react'

export default function PositionCalc() {
  const [portfolio, setPortfolio] = useState(100000)
  const [riskPct, setRiskPct] = useState(1)
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')

  const calc = () => {
    const e = parseFloat(entry)
    const s = parseFloat(stop)
    if (!e || !s || e <= s || e <= 0 || s <= 0) return null
    const riskAmount = (portfolio * riskPct) / 100
    const riskPerShare = e - s
    const shares = Math.floor(riskAmount / riskPerShare)
    const positionValue = shares * e
    const positionPct = (positionValue / portfolio) * 100
    return { riskAmount, riskPerShare, shares, positionValue, positionPct }
  }

  const result = calc()

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={14} className="text-terminal-green" />
        <div className="section-title mb-0">Position Sizing Calculator</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Portfolio Size ($)</label>
          <input
            type="number"
            value={portfolio}
            onChange={e => setPortfolio(+e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Risk Per Trade (%)</label>
          <input
            type="number"
            value={riskPct}
            step="0.1"
            min="0.1"
            max="10"
            onChange={e => setRiskPct(+e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Entry Price ($)</label>
          <input
            type="number"
            value={entry}
            onChange={e => setEntry(e.target.value)}
            placeholder="e.g. 182.50"
            className="input"
          />
        </div>
        <div>
          <label className="label">Stop Price ($)</label>
          <input
            type="number"
            value={stop}
            onChange={e => setStop(e.target.value)}
            placeholder="e.g. 165.00"
            className="input"
          />
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Risk Amount', fmtPrice(result.riskAmount)],
            ['Risk Per Share', fmtPrice(result.riskPerShare)],
            ['Shares to Buy', result.shares.toLocaleString()],
            ['Position Value', fmtPrice(result.positionValue)],
            ['Portfolio %', `${result.positionPct.toFixed(1)}%`],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 rounded bg-terminal-muted border border-terminal-border">
              <div className="text-xs text-terminal-dim">{label}</div>
              <div className="text-sm font-bold text-terminal-green">{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-terminal-dim text-center py-4">
          Enter entry &gt; stop to calculate position size.
        </div>
      )}
    </div>
  )
}
