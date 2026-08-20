import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, FolderOpen, HelpCircle, FileText, PenLine, BarChart3, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { to: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
  { to: '/admin/tests', label: 'Tests', icon: FileText },
  { to: '/admin/marking', label: 'Marking', icon: PenLine },
  { to: '/admin/results', label: 'Results', icon: BarChart3 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <h1 className="text-lg font-bold text-gray-900">Test Portal</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="mb-2 truncate text-sm font-medium text-gray-900">{user?.name}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex items-center border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-gray-900">Test Portal</h1>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
