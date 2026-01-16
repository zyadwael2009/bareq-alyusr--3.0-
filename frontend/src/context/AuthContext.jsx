import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, adminAPI, customerAPI, merchantAPI } from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsAuthenticated(true)
        
        // Refresh user data
        if (userData.user_type === 'customer') {
          const profile = await customerAPI.getProfile()
          const updatedUser = { ...userData, profile }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        } else if (userData.user_type === 'merchant') {
          const profile = await merchantAPI.getProfile()
          const updatedUser = { ...userData, profile }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        logout()
      }
    }
    setLoading(false)
  }
  
  const login = async (email, password, userType = 'user') => {
    try {
      let response
      if (userType === 'admin') {
        response = await adminAPI.login(email, password)
        const userData = {
          ...response.user,
          user_type: 'admin'
        }
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
        toast.success('تم تسجيل الدخول بنجاح')
        navigate('/admin')
      } else {
        response = await authAPI.login(email, password)
        const userData = {
          id: response.user.id,
          email: response.user.email,
          full_name: response.user.full_name,
          user_type: response.user.user_type,
        }
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
        toast.success('تم تسجيل الدخول بنجاح')
        
        if (response.user.user_type === 'customer') {
          navigate('/customer')
        } else if (response.user.user_type === 'merchant') {
          navigate('/merchant')
        } else {
          navigate('/')
        }
      }
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'خطأ في تسجيل الدخول'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  
  const registerCustomer = async (data) => {
    try {
      const response = await authAPI.registerCustomer(data)
      toast.success('تم التسجيل بنجاح! يرجى انتظار موافقة المشرف')
      navigate('/login')
      return { success: true, data: response }
    } catch (error) {
      const message = error.response?.data?.detail || 'خطأ في التسجيل'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  
  const registerMerchant = async (data) => {
    try {
      const response = await authAPI.registerMerchant(data)
      toast.success('تم التسجيل بنجاح! يرجى انتظار موافقة المشرف')
      navigate('/login')
      return { success: true, data: response }
    } catch (error) {
      const message = error.response?.data?.detail || 'خطأ في التسجيل'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    toast.info('تم تسجيل الخروج')
    navigate('/login')
  }
  
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    registerCustomer,
    registerMerchant,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
