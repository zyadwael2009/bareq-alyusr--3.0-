import { useState, useEffect } from 'react'
import { customerAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaCheck, FaTimes, FaClock, FaExchangeAlt,
  FaCalendarAlt, FaStore
} from 'react-icons/fa'

const CustomerTransactions = () => {
  const [loading, setLoading] = useState(true)
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [historyTransactions, setHistoryTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [numberOfMonths, setNumberOfMonths] = useState(12)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  useEffect(() => {
    loadTransactions()
  }, [])
  
  const loadTransactions = async () => {
    try {
      const [pending, history] = await Promise.all([
        customerAPI.getPendingTransactions().catch(() => []),
        customerAPI.getTransactionHistory().catch(() => [])
      ])
      setPendingTransactions(pending)
      setHistoryTransactions(history)
    } catch (error) {
      toast.error('خطأ في تحميل المعاملات')
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async () => {
    if (!selectedTransaction) return
    
    setActionLoading(true)
    try {
      await customerAPI.approveTransaction(selectedTransaction.id, numberOfMonths)
      toast.success('تمت الموافقة على المعاملة بنجاح')
      setShowApproveModal(false)
      setSelectedTransaction(null)
      loadTransactions()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في الموافقة على المعاملة')
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleReject = async () => {
    if (!selectedTransaction) return
    
    setActionLoading(true)
    try {
      await customerAPI.rejectTransaction(selectedTransaction.id, rejectReason)
      toast.success('تم رفض المعاملة')
      setShowRejectModal(false)
      setSelectedTransaction(null)
      setRejectReason('')
      loadTransactions()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في رفض المعاملة')
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
  
  const calculateMonthlyPayment = (amount, months) => {
    return amount / months
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
      <h1 className="text-2xl font-bold text-gray-800">المعاملات</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 space-x-reverse border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaClock className="inline ml-2" />
          معلقة ({pendingTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaExchangeAlt className="inline ml-2" />
          السجل ({historyTransactions.length})
        </button>
      </div>
      
      {/* Pending Transactions */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <FaClock className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500">لا توجد معاملات معلقة</p>
            </div>
          ) : (
            pendingTransactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FaStore className="text-gray-400" />
                      <span className="font-medium text-gray-600">
                        {tx.merchant_name || 'متجر'}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {tx.product_name || 'معاملة شراء'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {tx.description || `رقم المرجع: ${tx.reference_number}`}
                    </p>
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
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedTransaction(tx)
                          setShowApproveModal(true)
                        }}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FaCheck className="ml-2" />
                        موافقة
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTransaction(tx)
                          setShowRejectModal(true)
                        }}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FaTimes className="ml-2" />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Transaction History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <FaExchangeAlt className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500">لا توجد معاملات سابقة</p>
            </div>
          ) : (
            historyTransactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FaStore className="text-gray-400" />
                      <span className="font-medium text-gray-600">
                        {tx.merchant_name || 'متجر'}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {tx.product_name || 'معاملة شراء'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      رقم المرجع: {tx.reference_number}
                    </p>
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Approve Modal */}
      {showApproveModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              الموافقة على المعاملة
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">المبلغ الإجمالي</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(selectedTransaction.amount)}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                عدد أشهر السداد
              </label>
              <select
                value={numberOfMonths}
                onChange={(e) => setNumberOfMonths(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28].map(m => (
                  <option key={m} value={m}>{m} شهر</option>
                ))}
              </select>
            </div>
            
            <div className="bg-primary-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-primary-600">القسط الشهري</p>
              <p className="text-2xl font-bold text-primary-700">
                {formatCurrency(calculateMonthlyPayment(selectedTransaction.amount, numberOfMonths))}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <>
                    <FaCheck className="ml-2" />
                    تأكيد الموافقة
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedTransaction(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {showRejectModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              رفض المعاملة
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">
                {selectedTransaction.product_name || 'معاملة'}
              </p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(selectedTransaction.amount)}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                سبب الرفض (اختياري)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="أدخل سبب الرفض..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <>
                    <FaTimes className="ml-2" />
                    تأكيد الرفض
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedTransaction(null)
                  setRejectReason('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerTransactions
