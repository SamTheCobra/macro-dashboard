import { useEffect, useState } from 'react'
import { getTheses, getAllRegimeCompat, getPortfolioOverview } from '../utils/api'
import ThesisCard from '../components/ThesisCard'
import RegimeBanner from '../components/RegimeBanner'
import { Activity, TrendingUp, Briefcase, Target, Search } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = '#00ff88' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}12` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="text-xs mt-0.5 font-medium" style={{ color }}>{sub}</div>}
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
  const [search, setSearch] = useState('')

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

  const filtered = filter === 'all'
    ? activeTheses
    : filter === 'favored'
      ? activeTheses.filter(t => compatMap[t.id] === 'favored')
      : filter === 'challenged'
        ? activeTheses.filter(t => compatMap[t.id] === 'challenged')
        : activeTheses

  const displayed = search
    ? filtered.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.sector || '').toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  return (
    <div className="flex flex-col h-full">
      <RegimeBanner />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Row */}
        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-grid">
            <StatCard icon={Activity} label="Active Theses" value={overview.active_theses} color="#00ff88" />
            <StatCard icon={TrendingUp} label="Avg Health"
              value={overview.avg_health_score}
              sub={overview.avg_health_score >= 70 ? 'Strong' : overview.avg_health_score >= 40 ? 'Mixed' : 'Weak'}
              color={overview.avg_health_score >= 70 ? '#00ff88' : overview.avg_health_score >= 40 ? '#f59e0b' : '#ef4444'}
            />
            <StatCard icon={Briefcase} label="Active Bets" value={overview.total_active_bets} color="#3b82f6" />
            <StatCard icon={Target} label="Watching" value={overview.total_watching_bets} color="#8b949e" />
          </div>
        )}

        {/* Toolbar: Title + Search + Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-terminal-text">
            Active Theses
            <span className="text-terminal-dim text-sm font-normal ml-2">
              ({displayed.length}{search || filter !== 'all' ? ` of ${activeTheses.length}` : ''})
            </span>
          </h1>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-terminal-dim" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="input pl-8 py-1.5 w-40 text-xs"
              />
            </div>

            {/* Filter pills */}
            <div className="pill-group">
              {[
                { key: 'all', label: 'All' },
                { key: 'favored', label: 'Favored' },
                { key: 'challenged', label: 'Challenged' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={filter === f.key ? 'pill-active' : 'pill-inactive'}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thesis Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-52 rounded-lg" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-terminal-dim">
            <Activity size={40} className="mb-4 opacity-20" />
            <div className="text-lg mb-2">
              {search ? 'No matching theses' : 'No theses yet'}
            </div>
            <div className="text-sm">
              {search
                ? 'Try adjusting your search or filter.'
                : 'Click "New Thesis" to get started.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-grid">
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
