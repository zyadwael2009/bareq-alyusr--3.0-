import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaSearch, FaFilter, FaExchangeAlt, 
  FaUser, FaStore, FaCalendarAlt
} from 'react-icons/fa'

const AdminTransactions = () => {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  useEffect(() => {
    loadTransactions()
  }, [statusFilter])
  
  const loadTransactions = async () => {
    try {
      const status = statusFilter === 'all' ? null : statusFilter
      const data = await adminAPI.getTransactions(status)
      setTransactions(data)
    } catch (error) {
      toast.error('خطأ في تحميل المعاملات')
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
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
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
      tx.merchant_name?.toLowerCase().includes(query) ||
      tx.reference_number?.toLowerCase().includes(query) ||
      tx.product_name?.toLowerCase().includes(query)
    )
  })
  
  // Calculate stats
  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    approved: transactions.filter(t => t.status === 'approved').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    totalValue: transactions
      .filter(t => ['approved', 'completed'].includes(t.status))
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    totalFees: transactions
      .filter(t => ['approved', 'completed'].includes(t.status))
      .reduce((sum, t) => sum + (t.fee_amount || 0), 0)
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">إجمالي المعاملات</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">معلقة</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-500">موافق عليها</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
          <p className="text-sm text-gray-500">إجمالي القيمة</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalFees)}</p>
          <p className="text-sm text-gray-500">الرسوم المحصلة</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو رقم المرجع..."
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
            <option value="completed">مكتملة</option>
            <option value="rejected">مرفوضة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-4 px-6 font-medium text-gray-500">رقم المرجع</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">العميل</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">التاجر</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">المنتج</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">المبلغ</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">الرسوم</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">الحالة</th>
                <th className="text-right py-4 px-6 font-medium text-gray-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    لا توجد معاملات
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm text-gray-600">
                        {tx.reference_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600 text-sm" />
                        </div>
                        <span className="text-gray-800">{tx.customer_name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FaStore className="text-green-600 text-sm" />
                        </div>
                        <span className="text-gray-800">{tx.merchant_name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-800">
                      {tx.product_name || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-800">
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-red-600">
                        {formatCurrency(tx.fee_amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminTransactions
