import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { customerAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaWallet, FaExchangeAlt, FaCalendarAlt, FaCheckCircle, 
  FaTimesCircle, FaSpinner 
} from 'react-icons/fa'

const CustomerDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [upcomingPayments, setUpcomingPayments] = useState([])
  const [summary, setSummary] = useState(null)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [profileData, pendingData, upcomingData, summaryData] = await Promise.all([
        customerAPI.getProfile(),
        customerAPI.getPendingTransactions().catch(() => []),
        customerAPI.getUpcomingPayments().catch(() => []),
        customerAPI.getPaymentSummary().catch(() => null)
      ])
      
      setProfile(profileData)
      setPendingTransactions(pendingData)
      setUpcomingPayments(upcomingData)
      setSummary(summaryData)
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
      <div className="bg-gradient-to-l from-primary-600 to-primary-700 text-white rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              مرحباً، {profile.full_name}
            </h1>
            <p className="text-primary-100">
              لوحة تحكم حسابك في بارق اليسر
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-center">
            <p className="text-primary-100 text-xs">رقم العميل</p>
            <p className="text-2xl font-bold">{profile.id}</p>
            <p className="text-primary-100 text-xs">أعطِ هذا الرقم للتاجر</p>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">الحد الائتماني</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(profile.credit_limit)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FaWallet className="text-primary-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">المتاح</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(profile.available_limit)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">المستخدم</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(profile.used_limit)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaExchangeAlt className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Credit Usage Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">استخدام الحد الائتماني</h3>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-l from-primary-500 to-primary-600 transition-all duration-500"
            style={{ 
              width: `${profile.credit_limit > 0 ? (profile.used_limit / profile.credit_limit) * 100 : 0}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>مستخدم: {formatCurrency(profile.used_limit)}</span>
          <span>متاح: {formatCurrency(profile.available_limit)}</span>
        </div>
      </div>
      
      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">طلبات معلقة</h3>
            <Link to="/customer/transactions" className="text-primary-600 text-sm hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-4">
            {pendingTransactions.slice(0, 3).map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-gray-800">{tx.product_name || 'معاملة'}</p>
                  <p className="text-sm text-gray-500">
                    {tx.description || `رقم المرجع: ${tx.reference_number}`}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{formatCurrency(tx.amount)}</p>
                  <Link 
                    to="/customer/transactions" 
                    className="text-sm text-primary-600 hover:underline"
                  >
                    عرض التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Payment Summary */}
      {summary && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">ملخص السداد</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{summary.total_plans || 0}</p>
              <p className="text-sm text-gray-500">إجمالي الخطط</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{summary.active_plans || 0}</p>
              <p className="text-sm text-gray-500">خطط نشطة</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_paid)}</p>
              <p className="text-sm text-gray-500">إجمالي المدفوع</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_remaining)}</p>
              <p className="text-sm text-gray-500">المتبقي</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">الدفعات القادمة</h3>
            <Link to="/customer/repayments" className="text-primary-600 text-sm hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingPayments.slice(0, 5).map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-400 ml-3" />
                  <div>
                    <p className="font-medium text-gray-800">
                      القسط {payment.installment_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      استحقاق: {formatDate(payment.due_date)}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-800">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/customer/transactions"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center ml-4">
            <FaExchangeAlt className="text-primary-600 text-xl" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">المعاملات</h4>
            <p className="text-sm text-gray-500">عرض وإدارة معاملاتك</p>
          </div>
        </Link>
        
        <Link
          to="/customer/repayments"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ml-4">
            <FaCalendarAlt className="text-green-600 text-xl" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">خطط السداد</h4>
            <p className="text-sm text-gray-500">إدارة أقساطك الشهرية</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default CustomerDashboard
