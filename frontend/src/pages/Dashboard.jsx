import { useEffect, useState } from 'react'
import { getTheses, getAllRegimeCompat, getPortfolioOverview } from '../utils/api'
import ThesisCard from '../components/ThesisCard'
import RegimeBanner from '../components/RegimeBanner'
import { Activity, TrendingUp, Briefcase, Target } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = '#00ff88' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold text-terminal-text">{value}</div>
        <div className="text-xs text-terminal-dim">{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [theses, setTheses] = useState([])
  const [compatMap, setCompatMap] = useState({})
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTheses(),
      getAllRegimeCompat().catch(() => ({ theses: [] })),
      getPortfolioOverview().catch(() => null),
    ]).then(([ts, regimeData, ov]) => {
      setTheses(ts)
      const map = {}
      for (const t of regimeData.theses || []) {
        map[t.thesis_id] = t.compatibility
      }
      setCompatMap(map)
      setOverview(ov)
    }).finally(() => setLoading(false))
  }, [])

  const activeTheses = theses.filter(t => t.status === 'active')
  const displayed = filter === 'all'
    ? activeTheses
    : filter === 'favored'
      ? activeTheses.filter(t => compatMap[t.id] === 'favored')
      : filter === 'challenged'
        ? activeTheses.filter(t => compatMap[t.id] === 'challenged')
        : activeTheses

  return (
    <div className="flex flex-col h-full">
      <RegimeBanner />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Active Theses" value={overview.active_theses} color="#00ff88" />
            <StatCard icon={TrendingUp} label="Avg Health Score" value={`${overview.avg_health_score}`}
              sub={overview.avg_health_score >= 70 ? 'Portfolio Strong' : overview.avg_health_score >= 40 ? 'Mixed' : 'Needs Review'}
              color={overview.avg_health_score >= 70 ? '#00ff88' : overview.avg_health_score >= 40 ? '#f59e0b' : '#ef4444'}
            />
            <StatCard icon={Briefcase} label="Active Bets" value={overview.total_active_bets} color="#3b82f6" />
            <StatCard icon={Target} label="Watching" value={overview.total_watching_bets} color="#8b949e" />
          </div>
        )}

        {/* Filter toolbar */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-terminal-text">
            Active Theses
            <span className="text-terminal-dim text-sm font-normal ml-2">
              ({activeTheses.length} total)
            </span>
          </h1>
          <div className="flex items-center gap-1 bg-terminal-card border border-terminal-border rounded p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'favored', label: '↑ Favored' },
              { key: 'challenged', label: '↓ Challenged' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  filter === f.key
                    ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/20'
                    : 'text-terminal-dim hover:text-terminal-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thesis grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse h-52" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-terminal-dim">
            <Activity size={40} className="mb-4 opacity-20" />
            <div className="text-lg mb-2">No theses yet</div>
            <div className="text-sm">Click "New Thesis" in the sidebar to get started.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayed.map(thesis => (
              <ThesisCard
                key={thesis.id}
                thesis={thesis}
                compat={compatMap[thesis.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
