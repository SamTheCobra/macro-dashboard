import { useState } from 'react'
import { addCatalyst } from '../../utils/api'
import { X } from 'lucide-react'

const TYPES = ['fed', 'election', 'earnings', 'regulatory', 'other']

export default function CatalystModal({ thesisId, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    event_name: '',
    event_date: '',
    event_type: 'other',
    description: '',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.event_name.trim() || !form.event_date) {
      setError('Name and date are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await addCatalyst(thesisId, {
        ...form,
        event_date: `${form.event_date}T00:00:00`,
      })
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border">
          <h2 className="text-base font-bold text-terminal-green">Add Catalyst</h2>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-terminal-red text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Event Name *</label>
            <input className="input" value={form.event_name}
              onChange={e => update('event_name', e.target.value)}
              placeholder="e.g. FOMC Rate Decision" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.event_date}
                onChange={e => update('event_date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="select" value={form.event_type}
                onChange={e => update('event_type', e.target.value)}>
                {TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={3} value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="What would accelerate or invalidate the thesis?" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-terminal-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Add Catalyst'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
