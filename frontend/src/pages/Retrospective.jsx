import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTheses, closeThesis } from '../utils/api'
import { fmtDate, fmtPct, healthColor } from '../utils/formatters'
import { Archive, CheckCircle, XCircle, Clock, X } from 'lucide-react'

function CloseModal({ thesis, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    predicted_outcome: '',
    actual_outcome: '',
    timing_accuracy: 'on_time',
    key_hits: '',
    key_misses: '',
    right_thesis_wrong_instrument: false,
    final_pnl_pct: '',
    overall_grade: 'B',
  })
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await closeThesis(thesis.id, {
        ...form,
        final_pnl_pct: form.final_pnl_pct ? +form.final_pnl_pct : null,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border">
          <h2 className="text-base font-bold text-terminal-green">Close Thesis — Retrospective Scorecard</h2>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-sm text-terminal-amber font-medium">Closing: {thesis.name}</div>
          <div>
            <label className="label">Predicted Outcome</label>
            <textarea className="textarea" rows={2} value={form.predicted_outcome}
              onChange={e => update('predicted_outcome', e.target.value)} placeholder="What did you expect to happen?" />
          </div>
          <div>
            <label className="label">Actual Outcome</label>
            <textarea className="textarea" rows={2} value={form.actual_outcome}
              onChange={e => update('actual_outcome', e.target.value)} placeholder="What actually happened?" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Timing Accuracy</label>
              <select className="select" value={form.timing_accuracy} onChange={e => update('timing_accuracy', e.target.value)}>
                <option value="early">Early</option>
                <option value="on_time">On Time</option>
                <option value="late">Late</option>
                <option value="n_a">N/A</option>
              </select>
            </div>
            <div>
              <label className="label">Final P&L (%)</label>
              <input type="number" step="0.1" className="input" value={form.final_pnl_pct}
                onChange={e => update('final_pnl_pct', e.target.value)} placeholder="+25.3" />
            </div>
            <div>
              <label className="label">Overall Grade</label>
              <select className="select" value={form.overall_grade} onChange={e => update('overall_grade', e.target.value)}>
                {['A', 'B', 'C', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Key Hits (one per line)</label>
            <textarea className="textarea" rows={3} value={form.key_hits}
              onChange={e => update('key_hits', e.target.value)} placeholder="What went right?" />
          </div>
          <div>
            <label className="label">Key Misses (one per line)</label>
            <textarea className="textarea" rows={3} value={form.key_misses}
              onChange={e => update('key_misses', e.target.value)} placeholder="What went wrong?" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="wrong_instrument" checked={form.right_thesis_wrong_instrument}
              onChange={e => update('right_thesis_wrong_instrument', e.target.checked)} className="accent-terminal-green" />
            <label htmlFor="wrong_instrument" className="text-sm text-terminal-text cursor-pointer">
              Right thesis, wrong instrument
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-terminal-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Closing...' : 'Close Thesis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const GRADE_COLOR = { A: '#00ff88', B: '#22c55e', C: '#f59e0b', D: '#f97316', F: '#ef4444' }

export default function Retrospective() {
  const navigate = useNavigate()
  const [theses, setTheses] = useState([])
  const [activeTheses, setActiveTheses] = useState([])
  const [loading, setLoading] = useState(true)
  const [closeTarget, setCloseTarget] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      getTheses('closed'),
      getTheses('active'),
    ]).then(([closed, active]) => {
      setTheses(closed)
      setActiveTheses(active)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const avgPnl = theses.length
    ? theses.reduce((s, t) => s + (t.retro_scorecard?.final_pnl_pct || 0), 0) / theses.length
    : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-terminal-text">Retrospective Scorecard</h1>
        <div className="text-xs text-terminal-dim">
          {theses.length} closed theses
        </div>
      </div>

      {/* Stats */}
      {theses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="text-xs text-terminal-dim mb-1">Closed Theses</div>
            <div className="text-2xl font-bold text-terminal-text">{theses.length}</div>
          </div>
          <div className="card">
            <div className="text-xs text-terminal-dim mb-1">Avg P&L</div>
            <div className="text-2xl font-bold" style={{ color: (avgPnl || 0) >= 0 ? '#00ff88' : '#ef4444' }}>
              {avgPnl !== null ? fmtPct(avgPnl) : '—'}
            </div>
          </div>
          <div className="card">
            <div className="text-xs text-terminal-dim mb-1">Right Thesis, Wrong Instrument</div>
            <div className="text-2xl font-bold text-terminal-amber">
              {theses.filter(t => t.retro_scorecard?.right_thesis_wrong_instrument).length}
            </div>
          </div>
        </div>
      )}

      {/* Close an active thesis */}
      {activeTheses.length > 0 && (
        <div className="card">
          <div className="section-title">Close an Active Thesis</div>
          <div className="flex flex-wrap gap-2">
            {activeTheses.map(t => (
              <button
                key={t.id}
                onClick={() => setCloseTarget(t)}
                className="btn-secondary text-xs flex items-center gap-1"
              >
                <Archive size={11} /> {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Closed thesis scorecards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : theses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-terminal-dim">
          <Archive size={40} className="mb-4 opacity-20" />
          <div className="text-lg mb-2">No closed theses yet</div>
          <div className="text-sm">Close an active thesis above to record your retrospective.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {theses.map(thesis => {
            const retro = thesis.retro_scorecard
            const grade = retro?.overall_grade
            return (
              <div key={thesis.id} className="card hover:border-terminal-border/60 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3
                      className="text-base font-bold text-terminal-text cursor-pointer hover:text-terminal-green"
                      onClick={() => navigate(`/thesis/${thesis.id}`)}
                    >
                      {thesis.name}
                    </h3>
                    <div className="text-xs text-terminal-dim mt-1">
                      {thesis.sector} • Closed {fmtDate(retro?.closed_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {retro?.final_pnl_pct != null && (
                      <div
                        className="text-xl font-bold"
                        style={{ color: retro.final_pnl_pct >= 0 ? '#00ff88' : '#ef4444' }}
                      >
                        {fmtPct(retro.final_pnl_pct)}
                      </div>
                    )}
                    {grade && (
                      <div
                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                        style={{ borderColor: GRADE_COLOR[grade] || '#8b949e', color: GRADE_COLOR[grade] || '#8b949e' }}
                      >
                        {grade}
                      </div>
                    )}
                  </div>
                </div>

                {retro && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {retro.predicted_outcome && (
                      <div>
                        <div className="text-xs text-terminal-dim mb-1">Predicted</div>
                        <p className="text-sm text-terminal-text">{retro.predicted_outcome}</p>
                      </div>
                    )}
                    {retro.actual_outcome && (
                      <div>
                        <div className="text-xs text-terminal-dim mb-1">Actual</div>
                        <p className="text-sm text-terminal-text">{retro.actual_outcome}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 items-center">
                      {retro.timing_accuracy && (
                        <span className="badge bg-terminal-muted text-terminal-dim text-xs">
                          <Clock size={10} className="mr-1 inline" />
                          Timing: {retro.timing_accuracy.replace('_', ' ')}
                        </span>
                      )}
                      {retro.right_thesis_wrong_instrument && (
                        <span className="badge bg-amber-500/10 text-terminal-amber text-xs">
                          Right thesis, wrong instrument
                        </span>
                      )}
                    </div>

                    <div>
                      {retro.key_hits && (
                        <div className="mb-2">
                          <div className="text-xs text-terminal-green mb-1 flex items-center gap-1">
                            <CheckCircle size={10} /> Hits
                          </div>
                          {retro.key_hits.split('\n').filter(Boolean).map((h, i) => (
                            <div key={i} className="text-xs text-terminal-dim">• {h}</div>
                          ))}
                        </div>
                      )}
                      {retro.key_misses && (
                        <div>
                          <div className="text-xs text-terminal-red mb-1 flex items-center gap-1">
                            <XCircle size={10} /> Misses
                          </div>
                          {retro.key_misses.split('\n').filter(Boolean).map((m, i) => (
                            <div key={i} className="text-xs text-terminal-dim">• {m}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {closeTarget && (
        <CloseModal
          thesis={closeTarget}
          onClose={() => setCloseTarget(null)}
          onSaved={() => { setCloseTarget(null); load() }}
        />
      )}
    </div>
  )
}
