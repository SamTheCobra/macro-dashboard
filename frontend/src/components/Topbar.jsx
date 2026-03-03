import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Archive, RefreshCw, Plus } from 'lucide-react'
import { useState } from 'react'
import { triggerRefresh } from '../utils/api'
import ThesisModal from './modals/ThesisModal'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: BarChart3, label: 'Portfolio' },
  { to: '/retrospective', icon: Archive, label: 'Retrospective' },
]

export default function Topbar() {
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } finally {
      setTimeout(() => setRefreshing(false), 2000)
    }
  }

  return (
    <>
      <header className="topbar">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-terminal-green font-bold text-sm tracking-widest">▸ MACRO</span>
            <span className="text-terminal-dim text-xs tracking-widest hidden sm:inline">THESIS TRACKER</span>
          </NavLink>

          <div className="h-5 w-px bg-terminal-border hidden sm:block" />

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  isActive ? 'topbar-nav-active' : 'topbar-nav-inactive'
                }
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New Thesis</span>
          </button>
        </div>
      </header>

      {showModal && (
        <ThesisModal
          onClose={() => setShowModal(false)}
          onSaved={(t) => { setShowModal(false); navigate(`/thesis/${t.id}`) }}
        />
      )}
    </>
  )
}
