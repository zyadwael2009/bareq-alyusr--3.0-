import { useState, useEffect } from 'react'
import { merchantAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaMoneyBillWave, FaCheck, FaTimes, 
  FaUser, FaCalendarAlt, FaHashtag
} from 'react-icons/fa'

const PaymentRequests = () => {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [actionLoading, setActionLoading] = useState(null)
  
  useEffect(() => {
    loadRequests()
  }, [])
  
  const loadRequests = async () => {
    try {
      const data = await merchantAPI.getPaymentRequests()
      setRequests(data)
    } catch (error) {
      toast.error('خطأ في تحميل طلبات الدفع')
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async (scheduleId) => {
    setActionLoading(scheduleId)
    try {
      await merchantAPI.approvePaymentRequest(scheduleId)
      toast.success('تم قبول طلب الدفع بنجاح')
      loadRequests()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في قبول الطلب')
    } finally {
      setActionLoading(null)
    }
  }
  
  const handleReject = async (scheduleId) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return
    
    setActionLoading(scheduleId)
    try {
      await merchantAPI.rejectPaymentRequest(scheduleId)
      toast.info('تم رفض طلب الدفع')
      loadRequests()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في رفض الطلب')
    } finally {
      setActionLoading(null)
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
      day: 'numeric'
    })
  }
  
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">طلبات الدفع</h1>
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
          {requests.length} طلب منتظر
        </span>
      </div>
      
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FaMoneyBillWave className="text-gray-300 text-5xl mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد طلبات دفع منتظرة</p>
          <p className="text-gray-400 text-sm mt-2">
            ستظهر هنا طلبات الدفع عندما يقوم العملاء بطلب دفع الأقساط
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div 
              key={request.schedule_id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-orange-200"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-orange-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {request.customer_name}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaHashtag />
                          عميل #{request.customer_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt />
                          القسط {request.installment_number} من {request.total_installments}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        رقم المرجع: {request.transaction_reference}
                      </p>
                    </div>
                  </div>
                  
                  {/* Amount & Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl min-w-[120px]">
                      <p className="text-xs text-green-600 mb-1">المبلغ</p>
                      <p className="font-bold text-green-700 text-xl">
                        {formatCurrency(request.amount)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.schedule_id)}
                        disabled={actionLoading === request.schedule_id}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === request.schedule_id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaCheck />
                            قبول
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(request.schedule_id)}
                        disabled={actionLoading === request.schedule_id}
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <FaTimes />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">تاريخ الاستحقاق:</span>
                    <span className="font-medium text-gray-700 mr-2">
                      {formatDate(request.due_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">تاريخ الطلب:</span>
                    <span className="font-medium text-gray-700 mr-2">
                      {formatDateTime(request.requested_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">تعليمات</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• تأكد من استلام المبلغ من العميل قبل الموافقة على طلب الدفع</li>
          <li>• عند الموافقة، سيتم تحديث رصيد العميل وتسجيل الدفعة</li>
          <li>• في حال رفض الطلب، يمكن للعميل إعادة طلب الدفع</li>
        </ul>
      </div>
    </div>
  )
}

export default PaymentRequests
