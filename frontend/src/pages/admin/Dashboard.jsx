import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaUsers, FaStore, FaExchangeAlt, FaMoneyBillWave,
  FaSpinner, FaClock, FaCheckCircle
} from 'react-icons/fa'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    try {
      const data = await adminAPI.getDashboard()
      setStats(data)
    } catch (error) {
      toast.error('خطأ في تحميل الإحصائيات')
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-primary-600" />
      </div>
    )
  }
  
  const customerData = [
    { name: 'موافق عليهم', value: stats?.customers?.approved || 0, color: '#22c55e' },
    { name: 'في الانتظار', value: stats?.customers?.pending || 0, color: '#eab308' },
  ]
  
  const merchantData = [
    { name: 'موافق عليهم', value: stats?.merchants?.approved || 0, color: '#22c55e' },
    { name: 'في الانتظار', value: stats?.merchants?.pending || 0, color: '#eab308' },
  ]
  
  const transactionData = [
    { name: 'معلقة', value: stats?.transactions?.pending || 0 },
    { name: 'موافق عليها', value: stats?.transactions?.approved || 0 },
    { name: 'مكتملة', value: stats?.transactions?.completed || 0 },
  ]
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/customers" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي العملاء</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.customers?.total || 0}
              </p>
              {stats?.customers?.pending > 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  <FaClock className="inline ml-1" />
                  {stats.customers.pending} في الانتظار
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUsers className="text-blue-600 text-2xl" />
            </div>
          </div>
        </Link>
        
        <Link to="/admin/merchants" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي التجار</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.merchants?.total || 0}
              </p>
              {stats?.merchants?.pending > 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  <FaClock className="inline ml-1" />
                  {stats.merchants.pending} في الانتظار
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <FaStore className="text-green-600 text-2xl" />
            </div>
          </div>
        </Link>
        
        <Link to="/admin/transactions" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي المعاملات</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.transactions?.total || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats?.transactions?.total_value)}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <FaExchangeAlt className="text-purple-600 text-2xl" />
            </div>
          </div>
        </Link>
        
        <div className="bg-gradient-to-bl from-primary-600 to-primary-700 rounded-xl p-6 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">إجمالي الرسوم المحصلة</p>
              <p className="text-3xl font-bold">
                {formatCurrency(stats?.transactions?.total_fees)}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <FaMoneyBillWave className="text-2xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع العملاء</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {customerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Transaction Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">حالة المعاملات</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/customers"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center ml-4">
            <FaUsers className="text-blue-600 text-xl" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">إدارة العملاء</h4>
            <p className="text-sm text-gray-500">عرض وإدارة العملاء</p>
          </div>
        </Link>
        
        <Link
          to="/admin/merchants"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ml-4">
            <FaStore className="text-green-600 text-xl" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">إدارة التجار</h4>
            <p className="text-sm text-gray-500">عرض وإدارة التجار</p>
          </div>
        </Link>
        
        <Link
          to="/admin/transactions"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center ml-4">
            <FaExchangeAlt className="text-purple-600 text-xl" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">المعاملات</h4>
            <p className="text-sm text-gray-500">عرض جميع المعاملات</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
