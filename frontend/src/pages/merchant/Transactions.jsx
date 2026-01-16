import { useState, useEffect } from 'react'
import { merchantAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaClock, FaExchangeAlt, FaTimes, FaCalendarAlt,
  FaUser, FaSearch, FaFilter
} from 'react-icons/fa'

const MerchantTransactions = () => {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  useEffect(() => {
    loadTransactions()
  }, [statusFilter])
  
  const loadTransactions = async () => {
    try {
      const status = statusFilter === 'all' ? null : statusFilter
      const data = await merchantAPI.getTransactions(status)
      setTransactions(data)
    } catch (error) {
      toast.error('خطأ في تحميل المعاملات')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancel = async () => {
    if (!selectedTransaction) return
    
    setActionLoading(true)
    try {
      await merchantAPI.cancelTransaction(selectedTransaction.id, cancelReason)
      toast.success('تم إلغاء المعاملة')
      setShowCancelModal(false)
      setSelectedTransaction(null)
      setCancelReason('')
      loadTransactions()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في إلغاء المعاملة')
    } finally {
      setActionLoading(false)
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount || 0)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'معلق', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'موافق عليه', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'مرفوض', class: 'bg-red-100 text-red-800' },
      completed: { label: 'مكتمل', class: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'ملغي', class: 'bg-gray-100 text-gray-800' },
      expired: { label: 'منتهي', class: 'bg-gray-100 text-gray-800' }
    }
    const s = statusMap[status] || statusMap.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.class}`}>
        {s.label}
      </span>
    )
  }
  
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      tx.customer_name?.toLowerCase().includes(query) ||
      tx.product_name?.toLowerCase().includes(query) ||
      tx.reference_number?.toLowerCase().includes(query)
    )
  })
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">المعاملات</h1>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو المنتج أو رقم المرجع..."
            className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">معلقة</option>
            <option value="approved">موافق عليها</option>
            <option value="rejected">مرفوضة</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>
      </div>
      
      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <FaExchangeAlt className="text-gray-300 text-5xl mx-auto mb-4" />
          <p className="text-gray-500">لا توجد معاملات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">
                      #{tx.reference_number}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <FaUser className="text-gray-400" />
                    <span className="font-medium text-gray-800">
                      {tx.customer_name || 'عميل'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800">
                    {tx.product_name || 'معاملة شراء'}
                  </h3>
                  
                  {tx.description && (
                    <p className="text-sm text-gray-500 mt-1">{tx.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      <FaCalendarAlt className="inline ml-1" />
                      {formatDate(tx.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(tx.amount)}
                  </p>
                  {tx.status === 'approved' || tx.status === 'completed' ? (
                    <div className="text-sm text-gray-500 mt-1">
                      <p>الرسوم: {formatCurrency(tx.fee_amount)}</p>
                      <p className="text-green-600 font-medium">
                        المستلم: {formatCurrency(tx.merchant_receives)}
                      </p>
                    </div>
                  ) : null}
                  
                  {tx.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedTransaction(tx)
                        setShowCancelModal(true)
                      }}
                      className="mt-3 flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <FaTimes className="ml-2" />
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Cancel Modal */}
      {showCancelModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              إلغاء المعاملة
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">
                {selectedTransaction.product_name || 'معاملة'}
              </p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(selectedTransaction.amount)}
              </p>
              <p className="text-sm text-gray-500">
                العميل: {selectedTransaction.customer_name}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                سبب الإلغاء (اختياري)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="أدخل سبب الإلغاء..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <>
                    <FaTimes className="ml-2" />
                    تأكيد الإلغاء
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setSelectedTransaction(null)
                  setCancelReason('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantTransactions
