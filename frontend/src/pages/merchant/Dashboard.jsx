import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { merchantAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaWallet, FaExchangeAlt, FaPlusCircle, FaClock,
  FaCheckCircle, FaSpinner, FaMoneyBillWave, FaChartLine
} from 'react-icons/fa'

const MerchantDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [balance, setBalance] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [profileData, balanceData, transactionsData] = await Promise.all([
        merchantAPI.getProfile(),
        merchantAPI.getBalance().catch(() => null),
        merchantAPI.getTransactions().catch(() => [])
      ])
      
      setProfile(profileData)
      setBalance(balanceData)
      setRecentTransactions(transactionsData.slice(0, 5))
    } catch (error) {
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount || 0)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-SA')
  }
  
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'معلق', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'موافق عليه', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'مرفوض', class: 'bg-red-100 text-red-800' },
      completed: { label: 'مكتمل', class: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'ملغي', class: 'bg-gray-100 text-gray-800' }
    }
    const s = statusMap[status] || statusMap.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.class}`}>
        {s.label}
      </span>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-l from-secondary-600 to-secondary-700 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">
          مرحباً، {profile.full_name}
        </h1>
        <p className="text-secondary-100">
          {profile.business_name}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">الرصيد الحالي</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(balance?.current_balance || profile?.balance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FaWallet className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الأرباح</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(balance?.total_earnings || profile?.total_earnings)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaChartLine className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الرسوم</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(balance?.total_fees_paid || profile?.total_fees_paid)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaMoneyBillWave className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">المعاملات المعلقة</p>
              <p className="text-2xl font-bold text-yellow-600">
                {balance?.pending_transactions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/merchant/new-transaction"
          className="flex items-center p-6 bg-gradient-to-l from-primary-500 to-primary-600 text-white rounded-xl shadow-sm hover:shadow-lg transition-shadow"
        >
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center ml-4">
            <FaPlusCircle className="text-2xl" />
          </div>
          <div>
            <h4 className="text-xl font-bold">معاملة جديدة</h4>
            <p className="text-primary-100">إنشاء طلب شراء جديد</p>
          </div>
        </Link>
        
        <Link
          to="/merchant/transactions"
          className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center ml-4">
            <FaExchangeAlt className="text-2xl text-gray-600" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-800">سجل المعاملات</h4>
            <p className="text-gray-500">عرض جميع المعاملات</p>
          </div>
        </Link>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">آخر المعاملات</h3>
          <Link to="/merchant/transactions" className="text-primary-600 text-sm hover:underline">
            عرض الكل
          </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <FaExchangeAlt className="text-gray-300 text-4xl mx-auto mb-2" />
            <p className="text-gray-500">لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-medium text-gray-500">العميل</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">المنتج</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">المبلغ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{tx.customer_name || '-'}</td>
                    <td className="py-3 px-4">{tx.product_name || '-'}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Fee Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <strong>ملاحظة:</strong> يتم خصم رسوم 0.5% من كل معاملة موافق عليها.
        </p>
      </div>
    </div>
  )
}

export default MerchantDashboard
