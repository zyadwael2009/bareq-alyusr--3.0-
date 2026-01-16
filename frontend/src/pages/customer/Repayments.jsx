import { useState, useEffect } from 'react'
import { customerAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaWallet, FaCalendarAlt, FaCheckCircle, 
  FaClock, FaMoneyBillWave, FaHourglassHalf
} from 'react-icons/fa'

const CustomerRepayments = () => {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    loadPlans()
  }, [filter])
  
  const loadPlans = async () => {
    try {
      const status = filter === 'all' ? null : filter
      const data = await customerAPI.getRepaymentPlans(status)
      setPlans(data)
    } catch (error) {
      toast.error('خطأ في تحميل خطط السداد')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRequestPayment = async (scheduleId) => {
    setActionLoading(scheduleId)
    try {
      await customerAPI.requestPayment(scheduleId)
      toast.success('تم إرسال طلب الدفع بنجاح. في انتظار موافقة التاجر')
      loadPlans()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في إرسال طلب الدفع')
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
  
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'نشط', class: 'bg-green-100 text-green-800', icon: <FaClock /> },
      completed: { label: 'مكتمل', class: 'bg-blue-100 text-blue-800', icon: <FaCheckCircle /> },
      overdue: { label: 'متأخر', class: 'bg-red-100 text-red-800', icon: <FaClock /> }
    }
    const s = statusMap[status] || statusMap.active
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${s.class}`}>
        {s.icon}
        {s.label}
      </span>
    )
  }
  
  const getScheduleStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'معلق', class: 'bg-yellow-100 text-yellow-800' },
      payment_requested: { label: 'في انتظار الموافقة', class: 'bg-orange-100 text-orange-800' },
      paid: { label: 'مدفوع', class: 'bg-green-100 text-green-800' },
      partially_paid: { label: 'جزئي', class: 'bg-blue-100 text-blue-800' },
      overdue: { label: 'متأخر', class: 'bg-red-100 text-red-800' }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">خطط السداد</h1>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">جميع الخطط</option>
          <option value="active">نشطة</option>
          <option value="completed">مكتملة</option>
          <option value="overdue">متأخرة</option>
        </select>
      </div>
      
      {plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <FaWallet className="text-gray-300 text-5xl mx-auto mb-4" />
          <p className="text-gray-500">لا توجد خطط سداد</p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Plan Header */}
              <div className="p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(plan.status)}
                      <span className="text-sm text-gray-500">
                        رقم المرجع: {plan.transaction_reference}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                      المبلغ الإجمالي: {formatCurrency(plan.total_amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {plan.number_of_months} شهر - قسط شهري: {formatCurrency(plan.monthly_payment)}
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl min-w-[100px]">
                      <p className="text-xs text-green-600 mb-1">المدفوع</p>
                      <p className="font-bold text-green-700">{formatCurrency(plan.total_paid)}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl min-w-[100px]">
                      <p className="text-xs text-red-600 mb-1">المتبقي</p>
                      <p className="font-bold text-red-700">{formatCurrency(plan.remaining_amount)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>التقدم: {plan.payments_made} / {plan.number_of_months} أقساط</span>
                    <span>{Math.round((plan.payments_made / plan.number_of_months) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-500"
                      style={{ width: `${(plan.payments_made / plan.number_of_months) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Schedules */}
              <div className="p-6">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-primary-600" />
                  جدول الأقساط
                </h4>
                <div className="space-y-3">
                  {plan.schedules?.map((schedule, index) => (
                    <div 
                      key={schedule.id || index}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        schedule.status === 'paid' 
                          ? 'bg-green-50 border-green-200' 
                          : schedule.status === 'payment_requested'
                          ? 'bg-orange-50 border-orange-200'
                          : schedule.status === 'overdue'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          schedule.status === 'paid'
                            ? 'bg-green-200 text-green-700'
                            : schedule.status === 'payment_requested'
                            ? 'bg-orange-200 text-orange-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {schedule.status === 'paid' ? <FaCheckCircle /> : schedule.installment_number}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800">
                            القسط {schedule.installment_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(schedule.due_date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="font-bold text-gray-800 text-lg">
                            {formatCurrency(schedule.amount)}
                          </p>
                          {getScheduleStatusBadge(schedule.status)}
                        </div>
                        
                        {/* Action Button */}
                        {(schedule.status === 'pending' || schedule.status === 'overdue') && (
                          <button
                            onClick={() => handleRequestPayment(schedule.id)}
                            disabled={actionLoading === schedule.id}
                            className={`${schedule.status === 'overdue' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'} text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap`}
                          >
                            {actionLoading === schedule.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaMoneyBillWave />
                                طلب دفع
                              </>
                            )}
                          </button>
                        )}
                        
                        {schedule.status === 'payment_requested' && (
                          <div className="flex items-center gap-2 text-orange-600 bg-orange-100 px-3 py-2 rounded-lg">
                            <FaHourglassHalf />
                            <span className="text-sm font-medium">في انتظار التاجر</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerRepayments
