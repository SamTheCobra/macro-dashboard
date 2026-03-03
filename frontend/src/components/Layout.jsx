import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-terminal-bg overflow-hidden">
      <Topbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
