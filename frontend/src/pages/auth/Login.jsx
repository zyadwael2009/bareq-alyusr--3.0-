import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa'

const Login = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await login(email, password)
    setLoading(false)
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
        تسجيل الدخول
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <FaEnvelope className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="أدخل بريدك الإلكتروني"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            كلمة المرور
          </label>
          <div className="relative">
            <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin ml-2" />
              جاري التحميل...
            </>
          ) : (
            'تسجيل الدخول'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center space-y-2">
        <p className="text-gray-600">
          ليس لديك حساب؟
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/register/customer"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            سجل كعميل
          </Link>
          <Link
            to="/register/merchant"
            className="text-secondary-600 hover:text-secondary-700 font-medium"
          >
            سجل كتاجر
          </Link>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t">
        <Link
          to="/admin/login"
          className="block text-center text-gray-500 hover:text-gray-700 text-sm"
        >
          دخول المشرفين
        </Link>
      </div>
    </div>
  )
}

export default Login
