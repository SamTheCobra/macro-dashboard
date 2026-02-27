import { useState } from 'react'
import { createThesis, updateThesis } from '../../utils/api'
import { X, Plus, Trash2 } from 'lucide-react'

const SECTORS = [
  'Macro / Commodities / Gold',
  'Technology / Infrastructure / Energy',
  'Fixed Income / Macro / Financials',
  'Equities / Growth',
  'Emerging Markets',
  'Real Estate / REITs',
  'Currencies / FX',
  'Crypto / Digital Assets',
  'Energy / Oil & Gas',
  'Healthcare / Biotech',
  'Other',
]

const HORIZONS = [
  '1-3 months', '3-6 months', '6-12 months',
  '12-18 months', '12-24 months', '24-36 months', '36-60 months', '5+ years',
]

const emptyEffect = () => ({ order_level: 2, description: '', sort_order: 0 })
const emptyAssumption = () => ({ text: '', evidence_rating: 'mixed' })
const emptyInvalidation = () => ({ description: '' })
const emptyIndicator = () => ({ ticker_or_series_id: '', name: '', source: 'yfinance', expected_direction: 'up' })

export default function ThesisModal({ thesis, onClose, onSaved }) {
  const isEdit = Boolean(thesis?.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: thesis?.name || '',
    description: thesis?.description || '',
    sector: thesis?.sector || '',
    time_horizon: thesis?.time_horizon || '',
    confidence_level: thesis?.confidence_level || 7,
    activation_date: thesis?.activation_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    bear_case: thesis?.bear_case || '',
  })

  const [effects, setEffects] = useState(
    thesis?.second_order_effects?.length
      ? thesis.second_order_effects
      : [emptyEffect()]
  )
  const [assumptions, setAssumptions] = useState(
    thesis?.assumptions?.length ? thesis.assumptions : [emptyAssumption()]
  )
  const [invalidations, setInvalidations] = useState(
    thesis?.invalidation_conditions?.length
      ? thesis.invalidation_conditions
      : [emptyInvalidation()]
  )
  const [indicators, setIndicators] = useState(
    thesis?.proxy_indicators?.length ? thesis.proxy_indicators : [emptyIndicator()]
  )

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        confidence_level: parseInt(form.confidence_level),
        activation_date: form.activation_date ? `${form.activation_date}T00:00:00` : null,
        second_order_effects: effects.filter(e => e.description.trim()),
        assumptions: assumptions.filter(a => a.text.trim()),
        invalidation_conditions: invalidations.filter(i => i.description.trim()),
        proxy_indicators: indicators.filter(i => i.ticker_or_series_id.trim()),
        catalysts: [],
      }
      const saved = isEdit
        ? await updateThesis(thesis.id, form)
        : await createThesis(payload)
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border sticky top-0 bg-terminal-card z-10">
          <h2 className="text-base font-bold text-terminal-green">
            {isEdit ? 'Edit Thesis' : 'New Thesis'}
          </h2>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-terminal-red text-sm">
              {error}
            </div>
          )}

          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Thesis Name *</label>
              <input className="input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. USD Debasement & Hard Asset Premium" required />
            </div>
            <div>
              <label className="label">Sector</label>
              <select className="select" value={form.sector} onChange={e => update('sector', e.target.value)}>
                <option value="">Select sector...</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Time Horizon</label>
              <select className="select" value={form.time_horizon} onChange={e => update('time_horizon', e.target.value)}>
                <option value="">Select horizon...</option>
                {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Confidence Level (1-10)</label>
              <input type="range" min="1" max="10" value={form.confidence_level}
                onChange={e => update('confidence_level', e.target.value)} className="w-full accent-terminal-green" />
              <div className="text-center text-terminal-green font-bold mt-1">{form.confidence_level}</div>
            </div>
            <div>
              <label className="label">Activation Date</label>
              <input type="date" className="input" value={form.activation_date} onChange={e => update('activation_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={4} value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Describe the macro thesis, data points, and setup..." />
          </div>

          <div>
            <label className="label">Bear Case / Steelman of Opposing View</label>
            <textarea className="textarea" rows={3} value={form.bear_case}
              onChange={e => update('bear_case', e.target.value)}
              placeholder="What would make this thesis wrong?" />
          </div>

          {/* 2nd & 3rd Order Effects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">2nd & 3rd Order Effects</label>
              <button type="button" onClick={() => setEffects(p => [...p, emptyEffect()])}
                className="text-xs text-terminal-green hover:text-terminal-text flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {effects.map((eff, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    value={eff.order_level}
                    onChange={e => setEffects(p => p.map((x, j) => j === i ? { ...x, order_level: +e.target.value } : x))}
                    className="select w-24 shrink-0"
                  >
                    <option value={2}>2nd</option>
                    <option value={3}>3rd</option>
                  </select>
                  <input
                    value={eff.description}
                    onChange={e => setEffects(p => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    placeholder="Effect description..."
                    className="input flex-1"
                  />
                  <button type="button" onClick={() => setEffects(p => p.filter((_, j) => j !== i))}
                    className="text-terminal-dim hover:text-terminal-red pt-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Key Assumptions</label>
              <button type="button" onClick={() => setAssumptions(p => [...p, emptyAssumption()])}
                className="text-xs text-terminal-green hover:text-terminal-text flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {assumptions.map((a, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    value={a.text}
                    onChange={e => setAssumptions(p => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                    placeholder="Assumption text..."
                    className="input flex-1"
                  />
                  <select
                    value={a.evidence_rating}
                    onChange={e => setAssumptions(p => p.map((x, j) => j === i ? { ...x, evidence_rating: e.target.value } : x))}
                    className="select w-28 shrink-0"
                  >
                    <option value="strong">Strong</option>
                    <option value="mixed">Mixed</option>
                    <option value="weak">Weak</option>
                  </select>
                  <button type="button" onClick={() => setAssumptions(p => p.filter((_, j) => j !== i))}
                    className="text-terminal-dim hover:text-terminal-red pt-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Invalidation Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Invalidation Conditions</label>
              <button type="button" onClick={() => setInvalidations(p => [...p, emptyInvalidation()])}
                className="text-xs text-terminal-green hover:text-terminal-text flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {invalidations.map((inv, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    value={inv.description}
                    onChange={e => setInvalidations(p => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    placeholder="Signal that kills this thesis..."
                    className="input flex-1"
                  />
                  <button type="button" onClick={() => setInvalidations(p => p.filter((_, j) => j !== i))}
                    className="text-terminal-dim hover:text-terminal-red pt-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Proxy Indicators */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Proxy Indicators</label>
                <button type="button" onClick={() => setIndicators(p => [...p, emptyIndicator()])}
                  className="text-xs text-terminal-green hover:text-terminal-text flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {indicators.map((ind, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <input
                      value={ind.ticker_or_series_id}
                      onChange={e => setIndicators(p => p.map((x, j) => j === i ? { ...x, ticker_or_series_id: e.target.value.toUpperCase() } : x))}
                      placeholder="TICKER / SERIES_ID"
                      className="input col-span-3"
                    />
                    <input
                      value={ind.name}
                      onChange={e => setIndicators(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder="Display name"
                      className="input col-span-4"
                    />
                    <select value={ind.source}
                      onChange={e => setIndicators(p => p.map((x, j) => j === i ? { ...x, source: e.target.value } : x))}
                      className="select col-span-2">
                      <option value="yfinance">yfinance</option>
                      <option value="fred">FRED</option>
                    </select>
                    <select value={ind.expected_direction}
                      onChange={e => setIndicators(p => p.map((x, j) => j === i ? { ...x, expected_direction: e.target.value } : x))}
                      className="select col-span-2">
                      <option value="up">↑ Up</option>
                      <option value="down">↓ Down</option>
                      <option value="neutral">→ Neutral</option>
                    </select>
                    <button type="button" onClick={() => setIndicators(p => p.filter((_, j) => j !== i))}
                      className="text-terminal-dim hover:text-terminal-red pt-2 col-span-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-terminal-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEdit ? 'Update Thesis' : 'Create Thesis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
