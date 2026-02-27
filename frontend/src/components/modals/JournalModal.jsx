import { useState } from 'react'
import { addJournalEntry } from '../../utils/api'
import { X } from 'lucide-react'

const TAGS = [
  { value: 'new_data', label: 'New Data', color: '#3b82f6' },
  { value: 'catalyst', label: 'Catalyst', color: '#8b5cf6' },
  { value: 'changed_mind', label: 'Changed Mind', color: '#ef4444' },
  { value: 'reaffirmed', label: 'Reaffirmed', color: '#00ff88' },
]

export default function JournalModal({ thesisId, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    conviction_score: 7,
    note: '',
    tag: 'reaffirmed',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.note.trim()) { setError('Note is required'); return }
    setSaving(true)
    setError(null)
    try {
      const entry = await addJournalEntry(thesisId, {
        ...form,
        date: `${form.date}T00:00:00`,
        conviction_score: parseInt(form.conviction_score),
      })
      onSaved(entry)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedTag = TAGS.find(t => t.value === form.tag)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border">
          <h2 className="text-base font-bold text-terminal-green">Log Conviction Entry</h2>
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
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date}
                onChange={e => update('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Tag</label>
              <select className="select" value={form.tag} onChange={e => update('tag', e.target.value)}>
                {TAGS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">
              Conviction Score: <span
                style={{ color: form.conviction_score >= 7 ? '#00ff88' : form.conviction_score >= 5 ? '#f59e0b' : '#ef4444' }}
                className="text-lg font-bold ml-1"
              >
                {form.conviction_score}/10
              </span>
            </label>
            <input
              type="range" min="1" max="10" value={form.conviction_score}
              onChange={e => update('conviction_score', +e.target.value)}
              className="w-full accent-terminal-green mt-1"
            />
            <div className="flex justify-between text-xs text-terminal-dim mt-1">
              <span>1 — No conviction</span>
              <span>10 — Max conviction</span>
            </div>
          </div>

          <div>
            <label className="label">Note / Reasoning</label>
            <textarea
              className="textarea" rows={4} value={form.note}
              onChange={e => update('note', e.target.value)}
              placeholder="What changed? What data did you see? What's your reasoning?"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-terminal-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Log Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
