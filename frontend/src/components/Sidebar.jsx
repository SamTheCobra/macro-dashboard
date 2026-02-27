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

export default function Sidebar() {
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
      <aside className="w-56 flex flex-col border-r border-terminal-border bg-terminal-card shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-terminal-border">
          <div className="text-terminal-green font-bold text-sm tracking-widest uppercase">
            ▸ MACRO
          </div>
          <div className="text-terminal-dim text-xs tracking-widest">
            THESIS TRACKER
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/20'
                    : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-muted'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="p-3 border-t border-terminal-border space-y-2">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 text-xs"
          >
            <Plus size={13} />
            New Thesis
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Version */}
        <div className="px-4 py-3 text-terminal-dim text-xs border-t border-terminal-border">
          v1.0.0 • local
        </div>
      </aside>

      {showModal && (
        <ThesisModal
          onClose={() => setShowModal(false)}
          onSaved={(t) => { setShowModal(false); navigate(`/thesis/${t.id}`) }}
        />
      )}
    </>
  )
}
