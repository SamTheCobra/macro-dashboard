import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getThesis, deleteJournalEntry, updateAssumption, updateInvalidation } from '../utils/api'
import HealthScoreBadge from '../components/HealthScoreBadge'
import ConvictionChart from '../components/ConvictionChart'
import ProxyChart from '../components/ProxyChart'
import BetsTable from '../components/BetsTable'
import NewsPanel from '../components/NewsPanel'
import CatalystTimeline from '../components/CatalystTimeline'
import ThesisGraph from '../components/ThesisGraph'
import PositionCalc from '../components/PositionCalc'
import ThesisModal from '../components/modals/ThesisModal'
import BetModal from '../components/modals/BetModal'
import JournalModal from '../components/modals/JournalModal'
import { fmtDate, fmtDateTime, evidenceColor, tagColor, tagLabel, convictionColor } from '../utils/formatters'
import { ArrowLeft, Edit3, Plus, AlertTriangle, CheckCircle, Clock, Trash2, ChevronRight } from 'lucide-react'

const TABS = ['Overview', 'Proxy Charts', 'Conviction Log', 'Bets', 'Effects Graph', 'News', 'Catalysts']

export default function ThesisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [thesis, setThesis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBetModal, setShowBetModal] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getThesis(+id)
      .then(setThesis)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading || !thesis) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-48 mt-2" />
        <div className="skeleton h-64 mt-6" />
      </div>
    )
  }

  const sortedJournal = [...(thesis.conviction_entries || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  const triggeredCount = thesis.invalidation_conditions?.filter(c => c.is_triggered).length || 0

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-terminal-border bg-terminal-card/40">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-terminal-dim hover:text-terminal-green text-xs mb-3 transition-colors"
        >
          <ArrowLeft size={12} />
          Dashboard
          <ChevronRight size={10} />
          <span className="text-terminal-text">{thesis.name}</span>
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-terminal-text mb-2 truncate">{thesis.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {thesis.sector && <span className="badge-dim">{thesis.sector}</span>}
              {thesis.time_horizon && (
                <span className="flex items-center gap-1 text-xs text-terminal-dim">
                  <Clock size={11} /> {thesis.time_horizon}
                </span>
              )}
              <span className="text-xs text-terminal-dim">
                Active since {fmtDate(thesis.activation_date)}
              </span>
              {triggeredCount > 0 && (
                <span className="badge-red">
                  <AlertTriangle size={10} className="mr-1" />
                  {triggeredCount} triggered
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <HealthScoreBadge score={thesis.health_score} size="lg" />
            <button onClick={() => setShowEditModal(true)} className="btn-secondary text-xs">
              <Edit3 size={12} className="inline mr-1" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="border-b border-terminal-border px-6 bg-terminal-card/20">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs whitespace-nowrap transition-all ${
                tab === t ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {t}
              {t === 'Bets' && thesis.bets?.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-terminal-muted text-terminal-dim text-[10px]">
                  {thesis.bets.length}
                </span>
              )}
              {t === 'Overview' && triggeredCount > 0 && (
                <span className="ml-1 text-terminal-red text-[10px]">!</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── OVERVIEW ──────────────────────────────────── */}
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-5">
              {/* Description */}
              <div className="card">
                <div className="section-title">Thesis Description</div>
                <p className="text-sm text-terminal-text leading-relaxed">{thesis.description || '—'}</p>
              </div>

              {/* Assumptions */}
              <div className="card">
                <div className="section-title">Key Assumptions</div>
                {thesis.assumptions?.length ? (
                  <div className="space-y-2">
                    {thesis.assumptions.map(a => (
                      <div key={a.id} className="flex items-start gap-3 p-2 rounded hover:bg-terminal-muted/30 transition-colors">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: evidenceColor(a.evidence_rating) }}
                        />
                        <div className="flex-1 text-sm text-terminal-text">{a.text}</div>
                        <select
                          value={a.evidence_rating}
                          onChange={async (e) => {
                            await updateAssumption(a.id, { evidence_rating: e.target.value })
                            load()
                          }}
                          className="text-xs px-2 py-0.5 rounded border bg-transparent cursor-pointer"
                          style={{
                            color: evidenceColor(a.evidence_rating),
                            borderColor: `${evidenceColor(a.evidence_rating)}40`,
                          }}
                        >
                          <option value="strong">Strong</option>
                          <option value="mixed">Mixed</option>
                          <option value="weak">Weak</option>
                        </select>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-terminal-dim text-sm">No assumptions defined.</div>}
              </div>

              {/* Invalidation Conditions */}
              <div className="card">
                <div className="section-title">Invalidation Conditions</div>
                {thesis.invalidation_conditions?.length ? (
                  <div className="space-y-2">
                    {thesis.invalidation_conditions.map(inv => (
                      <div
                        key={inv.id}
                        className={`flex items-start gap-3 p-2.5 rounded transition-colors ${
                          inv.is_triggered
                            ? 'bg-terminal-red/8 border border-terminal-red/20'
                            : 'hover:bg-terminal-muted/30'
                        }`}
                      >
                        {inv.is_triggered ? (
                          <AlertTriangle size={14} className="text-terminal-red mt-0.5 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-terminal-border mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className={`text-sm ${inv.is_triggered ? 'text-terminal-red' : 'text-terminal-text'}`}>
                            {inv.description}
                          </div>
                          {inv.is_triggered && inv.triggered_at && (
                            <div className="text-xs text-terminal-dim mt-0.5">
                              Triggered {fmtDate(inv.triggered_at)}
                            </div>
                          )}
                        </div>
                        {!inv.is_triggered && (
                          <button
                            onClick={async () => {
                              await updateInvalidation(inv.id, { is_triggered: true })
                              load()
                            }}
                            className="text-xs text-terminal-dim hover:text-terminal-red shrink-0 transition-colors"
                            title="Mark as triggered"
                          >
                            Flag
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div className="text-terminal-dim text-sm">No invalidation conditions defined.</div>}
              </div>

              {/* Bear Case */}
              {thesis.bear_case && (
                <div className="card border-terminal-red/20">
                  <div className="section-title text-terminal-red">Bear Case / Steelman</div>
                  <p className="text-sm text-terminal-text leading-relaxed">{thesis.bear_case}</p>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Quick stats */}
              <div className="card">
                <div className="section-title">Thesis Metrics</div>
                <div className="space-y-3">
                  {[
                    ['Health Score', `${thesis.health_score}/100`],
                    ['Confidence', `${thesis.confidence_level}/10`],
                    ['Activation', fmtDate(thesis.activation_date)],
                    ['Status', thesis.status.toUpperCase()],
                    ['Active Bets', thesis.bets?.filter(b => b.status === 'active').length || 0],
                    ['Triggered', triggeredCount],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-terminal-dim">{label}</span>
                      <span className="text-terminal-text font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2nd/3rd order effects */}
              <div className="card">
                <div className="section-title">Order Effects</div>
                <div className="space-y-2">
                  {thesis.second_order_effects?.slice(0, 6).map(eff => (
                    <div key={eff.id} className="flex gap-2 text-xs">
                      <span
                        className="shrink-0 px-1.5 py-0.5 rounded font-medium"
                        style={{
                          color: eff.order_level === 2 ? '#f59e0b' : '#8b5cf6',
                          backgroundColor: eff.order_level === 2 ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                        }}
                      >
                        {eff.order_level}°
                      </span>
                      <span className="text-terminal-dim leading-relaxed">{eff.description}</span>
                    </div>
                  ))}
                  {(thesis.second_order_effects?.length || 0) > 6 && (
                    <button onClick={() => setTab('Effects Graph')} className="text-xs text-terminal-green hover:underline mt-1">
                      View all in graph →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROXY CHARTS ──────────────────────────────── */}
        {tab === 'Proxy Charts' && (
          <div>
            <div className="text-xs text-terminal-dim mb-4">
              Yellow dashed line marks thesis activation date. Trend vs expected direction determines proxy health score component.
            </div>
            {thesis.proxy_indicators?.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {thesis.proxy_indicators.map(ind => (
                  <ProxyChart key={ind.id} indicator={ind} activationDate={thesis.activation_date} />
                ))}
              </div>
            ) : (
              <div className="text-terminal-dim text-sm">No proxy indicators configured for this thesis.</div>
            )}
          </div>
        )}

        {/* ── CONVICTION LOG ────────────────────────────── */}
        {tab === 'Conviction Log' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="section-title mb-0">Conviction Over Time</div>
              <button
                onClick={() => setShowJournalModal(true)}
                className="btn-primary text-xs"
              >
                <Plus size={12} className="inline mr-1" /> Log Entry
              </button>
            </div>

            <div className="card">
              <ConvictionChart
                entries={thesis.conviction_entries || []}
                activationDate={thesis.activation_date}
              />
            </div>

            <div className="space-y-2">
              {sortedJournal.map(entry => (
                <div key={entry.id} className="card-sm hover:border-terminal-green/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="text-2xl font-bold tabular-nums"
                        style={{ color: convictionColor(entry.conviction_score) }}
                      >
                        {entry.conviction_score}
                      </span>
                      <div>
                        <div className="text-xs text-terminal-dim">{fmtDate(entry.date)}</div>
                        <div
                          className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
                          style={{
                            color: tagColor(entry.tag),
                            backgroundColor: `${tagColor(entry.tag)}18`,
                          }}
                        >
                          {tagLabel(entry.tag)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-terminal-text flex-1 leading-relaxed">{entry.note}</p>
                    <button
                      onClick={async () => {
                        await deleteJournalEntry(thesis.id, entry.id)
                        load()
                      }}
                      className="text-terminal-dim hover:text-terminal-red shrink-0 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {!sortedJournal.length && (
                <div className="text-terminal-dim text-sm text-center py-8">
                  No conviction entries yet. Log your first entry above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BETS ──────────────────────────────────────── */}
        {tab === 'Bets' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="section-title mb-0">Actionable Bets</div>
              <button onClick={() => setShowBetModal(true)} className="btn-primary text-xs">
                <Plus size={12} className="inline mr-1" /> Add Bet
              </button>
            </div>
            <BetsTable thesisId={thesis.id} bets={thesis.bets || []} onRefresh={load} />
            <PositionCalc />
          </div>
        )}

        {/* ── EFFECTS GRAPH ─────────────────────────────── */}
        {tab === 'Effects Graph' && (
          <div>
            <div className="text-xs text-terminal-dim mb-3">
              Interactive node graph. Drag nodes to rearrange. Colors: Thesis (green) → 2nd Order (amber) → 3rd Order (purple) → Bets (blue).
            </div>
            <ThesisGraph thesis={thesis} />
          </div>
        )}

        {/* ── NEWS ──────────────────────────────────────── */}
        {tab === 'News' && (
          <div>
            <div className="section-title">Latest Headlines</div>
            <NewsPanel thesisId={thesis.id} />
          </div>
        )}

        {/* ── CATALYSTS ─────────────────────────────────── */}
        {tab === 'Catalysts' && (
          <CatalystTimeline
            thesisId={thesis.id}
            catalysts={thesis.catalysts || []}
            onRefresh={load}
          />
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <ThesisModal
          thesis={thesis}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); load() }}
        />
      )}
      {showBetModal && (
        <BetModal
          thesisId={thesis.id}
          onClose={() => setShowBetModal(false)}
          onSaved={() => { setShowBetModal(false); load() }}
        />
      )}
      {showJournalModal && (
        <JournalModal
          thesisId={thesis.id}
          onClose={() => setShowJournalModal(false)}
          onSaved={() => { setShowJournalModal(false); load() }}
        />
      )}
    </div>
  )
}
