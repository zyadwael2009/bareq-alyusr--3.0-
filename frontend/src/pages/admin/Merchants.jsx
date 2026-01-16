import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaCheck, FaTimes, FaSearch, FaFilter, 
  FaStore, FaPhone, FaEnvelope
} from 'react-icons/fa'

const AdminMerchants = () => {
  const [loading, setLoading] = useState(true)
  const [merchants, setMerchants] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  useEffect(() => {
    loadMerchants()
  }, [statusFilter])
  
  const loadMerchants = async () => {
    try {
      const status = statusFilter === 'all' ? null : statusFilter
      const data = await adminAPI.getMerchants(status)
      setMerchants(data)
    } catch (error) {
      toast.error('خطأ في تحميل التجار')
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async () => {
    if (!selectedMerchant) return
    
    setActionLoading(true)
    try {
      await adminAPI.approveMerchant(selectedMerchant.id)
      toast.success('تمت الموافقة على التاجر')
      setShowApproveModal(false)
      setSelectedMerchant(null)
      loadMerchants()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في الموافقة')
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleReject = async () => {
    if (!selectedMerchant) return
    
    setActionLoading(true)
    try {
      await adminAPI.rejectMerchant(selectedMerchant.id, rejectReason)
      toast.success('تم رفض التاجر')
      setShowRejectModal(false)
      setSelectedMerchant(null)
      setRejectReason('')
      loadMerchants()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في الرفض')
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
  
  const filteredMerchants = merchants.filter(m => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(query) ||
      m.business_name?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.phone_number?.includes(query)
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
            placeholder="بحث بالاسم أو المتجر أو البريد..."
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
      
      {/* Cards Grid */}
      {filteredMerchants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <FaStore className="text-gray-300 text-5xl mx-auto mb-4" />
          <p className="text-gray-500">لا يوجد تجار</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMerchants.map(merchant => (
            <div key={merchant.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className={`p-4 ${merchant.is_approved ? 'bg-green-600' : 'bg-yellow-500'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FaStore className="text-white text-xl" />
                  </div>
                  <div className="text-white">
                    <h3 className="font-bold">{merchant.business_name}</h3>
                    <p className="text-sm opacity-90">{merchant.full_name}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaEnvelope className="text-gray-400" />
                  <span className="text-sm">{merchant.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <FaPhone className="text-gray-400" />
                  <span className="text-sm">{merchant.phone_number}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">السجل التجاري</p>
                    <p className="font-medium">{merchant.commercial_registration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">نوع النشاط</p>
                    <p className="font-medium">{merchant.business_category || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                  <div>
                    <p className="text-gray-500">الرصيد</p>
                    <p className="font-medium text-green-600">{formatCurrency(merchant.balance)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">إجمالي الأرباح</p>
                    <p className="font-medium">{formatCurrency(merchant.total_earnings)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    merchant.is_approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {merchant.is_approved ? 'مفعل' : 'في الانتظار'}
                  </span>
                  
                  {!merchant.is_approved && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedMerchant(merchant)
                          setShowApproveModal(true)
                        }}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMerchant(merchant)
                          setShowRejectModal(true)
                        }}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Approve Modal */}
      {showApproveModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              الموافقة على التاجر
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">{selectedMerchant.business_name}</p>
              <p className="text-sm text-gray-500">{selectedMerchant.full_name}</p>
              <p className="text-sm text-gray-500">{selectedMerchant.email}</p>
            </div>
            
            <p className="text-gray-600 mb-4">
              هل أنت متأكد من الموافقة على هذا التاجر؟ سيتمكن من إرسال طلبات شراء للعملاء.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaCheck className="ml-2" /> موافقة</>}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedMerchant(null)
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
      {showRejectModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              رفض التاجر
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">{selectedMerchant.business_name}</p>
              <p className="text-sm text-gray-500">{selectedMerchant.full_name}</p>
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
                  setSelectedMerchant(null)
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

export default AdminMerchants
