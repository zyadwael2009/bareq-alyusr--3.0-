import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  FaHome, FaUsers, FaStore, FaExchangeAlt, FaSignOutAlt,
  FaBars, FaTimes, FaCog
} from 'react-icons/fa'
import { useState } from 'react'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const navLinks = [
    { path: '/admin', label: 'لوحة التحكم', icon: <FaHome size={20} /> },
    { path: '/admin/customers', label: 'العملاء', icon: <FaUsers size={20} /> },
    { path: '/admin/merchants', label: 'التجار', icon: <FaStore size={20} /> },
    { path: '/admin/transactions', label: 'المعاملات', icon: <FaExchangeAlt size={20} /> },
  ]
  
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gray-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-xl font-bold">لوحة الإدارة</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-4 py-3 transition-colors ${
                location.pathname === link.path
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className={sidebarOpen ? 'ml-3' : 'mx-auto'}>{link.icon}</span>
              {sidebarOpen && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={logout}
            className={`flex items-center w-full px-4 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <FaSignOutAlt size={20} />
            {sidebarOpen && <span className="mr-3">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {navLinks.find(l => l.path === location.pathname)?.label || 'لوحة التحكم'}
          </h2>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-gray-600">
              مرحباً، <strong>{user?.full_name}</strong>
            </span>
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white">
              <FaCog />
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
