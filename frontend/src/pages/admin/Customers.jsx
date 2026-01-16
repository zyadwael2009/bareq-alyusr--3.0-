import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaCheck, FaTimes, FaEdit, FaSearch, 
  FaFilter, FaUser, FaPhone, FaEnvelope, FaWallet
} from 'react-icons/fa'

const AdminCustomers = () => {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creditLimit, setCreditLimit] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  useEffect(() => {
    loadCustomers()
  }, [statusFilter])
  
  const loadCustomers = async () => {
    try {
      const status = statusFilter === 'all' ? null : statusFilter
      const data = await adminAPI.getCustomers(status)
      setCustomers(data)
    } catch (error) {
      toast.error('خطأ في تحميل العملاء')
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async () => {
    if (!selectedCustomer || !creditLimit) return
    
    setActionLoading(true)
    try {
      await adminAPI.approveCustomer(selectedCustomer.id, parseFloat(creditLimit))
      toast.success('تمت الموافقة على العميل')
      setShowApproveModal(false)
      setSelectedCustomer(null)
      setCreditLimit('')
      loadCustomers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في الموافقة')
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleReject = async () => {
    if (!selectedCustomer) return
    
    setActionLoading(true)
    try {
      await adminAPI.rejectCustomer(selectedCustomer.id, rejectReason)
      toast.success('تم رفض العميل')
      setShowRejectModal(false)
      setSelectedCustomer(null)
      setRejectReason('')
      loadCustomers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في الرفض')
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleUpdateCredit = async () => {
    if (!selectedCustomer || !creditLimit) return
    
    setActionLoading(true)
    try {
      await adminAPI.updateCreditLimit(selectedCustomer.id, parseFloat(creditLimit))
      toast.success('تم تحديث الحد الائتماني')
      setShowEditModal(false)
      setSelectedCustomer(null)
      setCreditLimit('')
      loadCustomers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في التحديث')
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
    return new Date(date).toLocaleDateString('ar-SA')
  }
  
  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone_number?.includes(query) ||
      c.national_id?.includes(query)
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
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو الهاتف..."
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
            <option value="pending">في الانتظار</option>
            <option value="approved">موافق عليهم</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-4 px-6 font-medium text-gray-500">العميل</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">رقم الهوية</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">الحد الائتماني</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">الحالة</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">التاريخ</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    لا يوجد عملاء
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{customer.full_name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                          <p className="text-sm text-gray-500">{customer.phone_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-800">{customer.national_id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-800">{formatCurrency(customer.credit_limit)}</p>
                        <p className="text-sm text-green-600">متاح: {formatCurrency(customer.available_limit)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        customer.is_approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {customer.is_approved ? 'مفعل' : 'في الانتظار'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{formatDate(customer.created_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {!customer.is_approved ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setCreditLimit('5000')
                                setShowApproveModal(true)
                              }}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              title="موافقة"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowRejectModal(true)
                              }}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              title="رفض"
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setCreditLimit(customer.credit_limit?.toString() || '')
                              setShowEditModal(true)
                            }}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            title="تعديل الحد"
                          >
                            <FaEdit />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Approve Modal */}
      {showApproveModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              الموافقة على العميل
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">{selectedCustomer.full_name}</p>
              <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                الحد الائتماني
              </label>
              <div className="relative">
                <FaWallet className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="أدخل الحد الائتماني"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading || !creditLimit}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaCheck className="ml-2" /> موافقة</>}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedCustomer(null)
                  setCreditLimit('')
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
      {showRejectModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              رفض العميل
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">{selectedCustomer.full_name}</p>
              <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
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
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaTimes className="ml-2" /> رفض</>}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedCustomer(null)
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
      
      {/* Edit Credit Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              تعديل الحد الائتماني
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">{selectedCustomer.full_name}</p>
              <p className="text-sm text-gray-500">الحد الحالي: {formatCurrency(selectedCustomer.credit_limit)}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                الحد الائتماني الجديد
              </label>
              <div className="relative">
                <FaWallet className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleUpdateCredit}
                disabled={actionLoading || !creditLimit}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaCheck className="ml-2" /> حفظ</>}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedCustomer(null)
                  setCreditLimit('')
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

export default AdminCustomers
