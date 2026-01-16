import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  FaHome, FaExchangeAlt, FaWallet, FaUser, FaSignOutAlt, 
  FaStore, FaPlusCircle, FaBars, FaTimes, FaMoneyCheckAlt 
} from 'react-icons/fa'
import { useState } from 'react'

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { path: '/', label: 'الرئيسية', icon: <FaHome /> },
      ]
    }
    
    if (user?.user_type === 'customer') {
      return [
        { path: '/customer', label: 'لوحة التحكم', icon: <FaHome /> },
        { path: '/customer/transactions', label: 'المعاملات', icon: <FaExchangeAlt /> },
        { path: '/customer/repayments', label: 'خطط السداد', icon: <FaWallet /> },
        { path: '/customer/profile', label: 'الملف الشخصي', icon: <FaUser /> },
      ]
    }
    
    if (user?.user_type === 'merchant') {
      return [
        { path: '/merchant', label: 'لوحة التحكم', icon: <FaHome /> },
        { path: '/merchant/new-transaction', label: 'معاملة جديدة', icon: <FaPlusCircle /> },
        { path: '/merchant/transactions', label: 'المعاملات', icon: <FaExchangeAlt /> },
        { path: '/merchant/payment-requests', label: 'طلبات الدفع', icon: <FaMoneyCheckAlt /> },
        { path: '/merchant/profile', label: 'الملف الشخصي', icon: <FaStore /> },
      ]
    }
    
    return []
  }
  
  const navLinks = getNavLinks()
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-l from-primary-600 to-primary-700 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 space-x-reverse">
              <span className="text-2xl font-bold">بارق اليسر</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 space-x-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="ml-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="flex items-center px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-red-200"
                >
                  <FaSignOutAlt className="ml-2" />
                  خروج
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  تسجيل الدخول
                </Link>
              )}
            </nav>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="ml-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logout()
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-red-200"
                >
                  <FaSignOutAlt className="ml-2" />
                  خروج
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center mx-4 mt-2 px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  تسجيل الدخول
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 بارق اليسر. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
