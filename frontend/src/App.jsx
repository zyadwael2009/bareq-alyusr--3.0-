import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'

// Public pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import RegisterCustomer from './pages/auth/RegisterCustomer'
import RegisterMerchant from './pages/auth/RegisterMerchant'

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerTransactions from './pages/customer/Transactions'
import CustomerRepayments from './pages/customer/Repayments'
import CustomerProfile from './pages/customer/Profile'

// Merchant pages
import MerchantDashboard from './pages/merchant/Dashboard'
import MerchantTransactions from './pages/merchant/Transactions'
import NewTransaction from './pages/merchant/NewTransaction'
import PaymentRequests from './pages/merchant/PaymentRequests'
import MerchantProfile from './pages/merchant/Profile'

// Admin pages
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCustomers from './pages/admin/Customers'
import AdminMerchants from './pages/admin/Merchants'
import AdminTransactions from './pages/admin/Transactions'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.user_type)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register/customer" element={<RegisterCustomer />} />
        <Route path="/register/merchant" element={<RegisterMerchant />} />
      </Route>
      
      {/* Customer Routes */}
      <Route path="/customer" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<CustomerDashboard />} />
        <Route path="transactions" element={<CustomerTransactions />} />
        <Route path="repayments" element={<CustomerRepayments />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>
      
      {/* Merchant Routes */}
      <Route path="/merchant" element={
        <ProtectedRoute allowedRoles={['merchant']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<MerchantDashboard />} />
        <Route path="transactions" element={<MerchantTransactions />} />
        <Route path="new-transaction" element={<NewTransaction />} />
        <Route path="payment-requests" element={<PaymentRequests />} />
        <Route path="profile" element={<MerchantProfile />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="merchants" element={<AdminMerchants />} />
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
