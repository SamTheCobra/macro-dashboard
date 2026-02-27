import { useState } from 'react'
import { createBet, updateBet } from '../../utils/api'
import { X, Plus, Trash2 } from 'lucide-react'

const emptyScenario = (type) => ({
  scenario_type: type,
  expected_return_pct: 0,
  probability: type === 'base' ? 0.5 : type === 'bull' ? 0.25 : 0.25,
  notes: '',
  target_price: '',
})

export default function BetModal({ thesisId, bet, onClose, onSaved }) {
  const isEdit = Boolean(bet?.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: bet?.name || '',
    ticker: bet?.ticker || '',
    entry_price: bet?.entry_price ?? '',
    target_price: bet?.target_price ?? '',
    stop_price: bet?.stop_price ?? '',
    position_size_pct: bet?.position_size_pct ?? '',
    status: bet?.status || 'watching',
    entry_date: bet?.entry_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    notes: bet?.notes || '',
  })

  const [scenarios, setScenarios] = useState(
    bet?.scenarios?.length
      ? bet.scenarios
      : [emptyScenario('bull'), emptyScenario('base'), emptyScenario('bear')]
  )

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const updateScenario = (i, k, v) =>
    setScenarios(p => p.map((s, j) => j === i ? { ...s, [k]: v } : s))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        entry_price: form.entry_price ? +form.entry_price : null,
        target_price: form.target_price ? +form.target_price : null,
        stop_price: form.stop_price ? +form.stop_price : null,
        position_size_pct: form.position_size_pct ? +form.position_size_pct : null,
        entry_date: form.entry_date ? `${form.entry_date}T00:00:00` : null,
        scenarios: scenarios.map(s => ({
          ...s,
          expected_return_pct: +s.expected_return_pct,
          probability: +s.probability,
          target_price: s.target_price ? +s.target_price : null,
        })),
      }
      const saved = isEdit
        ? await updateBet(bet.id, form)
        : await createBet(thesisId, payload)
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border sticky top-0 bg-terminal-card z-10">
          <h2 className="text-base font-bold text-terminal-green">
            {isEdit ? 'Edit Bet' : 'Add Actionable Bet'}
          </h2>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-terminal-red text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Bet Name *</label>
              <input className="input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Long Gold via GLD ETF" required />
            </div>
            <div>
              <label className="label">Ticker</label>
              <input className="input" value={form.ticker} onChange={e => update('ticker', e.target.value.toUpperCase())} placeholder="GLD" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="watching">Watching</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="label">Entry Price ($)</label>
              <input type="number" step="0.01" className="input" value={form.entry_price} onChange={e => update('entry_price', e.target.value)} placeholder="182.50" />
            </div>
            <div>
              <label className="label">Target Price ($)</label>
              <input type="number" step="0.01" className="input" value={form.target_price} onChange={e => update('target_price', e.target.value)} placeholder="240.00" />
            </div>
            <div>
              <label className="label">Stop/Invalidation Price ($)</label>
              <input type="number" step="0.01" className="input" value={form.stop_price} onChange={e => update('stop_price', e.target.value)} placeholder="165.00" />
            </div>
            <div>
              <label className="label">Position Size (%)</label>
              <input type="number" step="0.1" className="input" value={form.position_size_pct} onChange={e => update('position_size_pct', e.target.value)} placeholder="5.0" />
            </div>
            <div>
              <label className="label">Entry Date</label>
              <input type="date" className="input" value={form.entry_date} onChange={e => update('entry_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Rationale, sizing logic..." />
          </div>

          {/* Scenarios */}
          {!isEdit && (
            <div>
              <div className="section-title">Bull / Base / Bear Scenarios</div>
              <div className="space-y-3">
                {scenarios.map((sc, i) => {
                  const color = sc.scenario_type === 'bull' ? '#00ff88' : sc.scenario_type === 'bear' ? '#ef4444' : '#f59e0b'
                  return (
                    <div key={i} className="p-3 rounded border" style={{ borderColor: `${color}30`, backgroundColor: `${color}05` }}>
                      <div className="text-xs font-bold uppercase mb-2" style={{ color }}>
                        {sc.scenario_type}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="label">Expected Return (%)</label>
                          <input type="number" step="1" className="input" value={sc.expected_return_pct}
                            onChange={e => updateScenario(i, 'expected_return_pct', e.target.value)} />
                        </div>
                        <div>
                          <label className="label">Probability (0–1)</label>
                          <input type="number" step="0.05" min="0" max="1" className="input" value={sc.probability}
                            onChange={e => updateScenario(i, 'probability', e.target.value)} />
                        </div>
                        <div>
                          <label className="label">Target Price ($)</label>
                          <input type="number" step="0.01" className="input" value={sc.target_price}
                            onChange={e => updateScenario(i, 'target_price', e.target.value)} placeholder="optional" />
                        </div>
                        <div className="col-span-3">
                          <label className="label">Notes</label>
                          <input className="input" value={sc.notes}
                            onChange={e => updateScenario(i, 'notes', e.target.value)} placeholder="Scenario conditions..." />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-terminal-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEdit ? 'Update Bet' : 'Add Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
