import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { merchantAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSearch, FaUser, FaShoppingCart, FaMoneyBillWave, 
  FaSpinner, FaCheck, FaInfoCircle 
} from 'react-icons/fa'

const NewTransaction = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  
  const [customerId, setCustomerId] = useState('')
  const [customer, setCustomer] = useState(null)
  const [searchError, setSearchError] = useState('')
  
  const [formData, setFormData] = useState({
    amount: '',
    product_name: '',
    description: ''
  })
  
  const handleSearch = async () => {
    if (!customerId || isNaN(parseInt(customerId))) {
      setSearchError('يرجى إدخال رقم عميل صحيح')
      return
    }
    
    setSearchLoading(true)
    setSearchError('')
    setCustomer(null)
    
    try {
      const data = await merchantAPI.searchCustomer(parseInt(customerId))
      setCustomer(data)
      setStep(2)
    } catch (error) {
      setSearchError(error.response?.data?.detail || 'لم يتم العثور على العميل')
    } finally {
      setSearchLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }
    
    if (parseFloat(formData.amount) > customer.available_limit) {
      toast.error('المبلغ يتجاوز الحد المتاح للعميل')
      return
    }
    
    setLoading(true)
    try {
      await merchantAPI.createTransaction({
        customer_id: customer.id,
        amount: parseFloat(formData.amount),
        product_name: formData.product_name,
        description: formData.description
      })
      toast.success('تم إرسال طلب الشراء بنجاح')
      navigate('/merchant/transactions')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في إنشاء المعاملة')
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
  
  const calculateFee = () => {
    const amount = parseFloat(formData.amount) || 0
    return amount * 0.005
  }
  
  const calculateMerchantReceives = () => {
    const amount = parseFloat(formData.amount) || 0
    return amount - calculateFee()
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">معاملة جديدة</h1>
      
      {/* Steps */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
          }`}>
            {step > 1 ? <FaCheck /> : '1'}
          </div>
          <span className="mr-2 font-medium">البحث عن العميل</span>
        </div>
        
        <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
          <div className={`h-full bg-primary-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
        </div>
        
        <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="mr-2 font-medium">تفاصيل المعاملة</span>
        </div>
      </div>
      
      {/* Step 1: Search Customer */}
      {step === 1 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            <FaSearch className="inline ml-2" />
            البحث عن العميل
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                رقم العميل
              </label>
              <input
                type="number"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                placeholder="أدخل رقم العميل"
                dir="ltr"
              />
            </div>
            
            {searchError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                {searchError}
              </div>
            )}
            
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
            >
              {searchLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaSearch className="ml-2" />
                  بحث
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Transaction Details */}
      {step === 2 && customer && (
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <FaUser className="inline ml-2" />
              معلومات العميل
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">الاسم</p>
                <p className="font-medium text-gray-800">{customer.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">رقم الهاتف</p>
                <p className="font-medium text-gray-800" dir="ltr">{customer.phone_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الحد المتاح</p>
                <p className="font-bold text-green-600 text-lg">
                  {formatCurrency(customer.available_limit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الحالة</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  مفعل
                </span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setStep(1)
                setCustomer(null)
              }}
              className="mt-4 text-primary-600 hover:underline text-sm"
            >
              ← البحث عن عميل آخر
            </button>
          </div>
          
          {/* Transaction Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <FaShoppingCart className="inline ml-2" />
              تفاصيل المعاملة
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  المبلغ *
                </label>
                <div className="relative">
                  <FaMoneyBillWave className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg text-lg"
                    placeholder="0.00"
                    min="0"
                    max={customer.available_limit}
                    step="0.01"
                    required
                  />
                </div>
                {formData.amount && parseFloat(formData.amount) > customer.available_limit && (
                  <p className="text-red-500 text-sm mt-1">
                    المبلغ يتجاوز الحد المتاح ({formatCurrency(customer.available_limit)})
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  اسم المنتج
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="مثال: جوال ايفون 15"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  وصف إضافي
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="تفاصيل إضافية عن المنتج أو الخدمة..."
                />
              </div>
            </div>
            
            {/* Fee Calculation */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">ملخص المعاملة</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">المبلغ الإجمالي</span>
                    <span className="font-medium">{formatCurrency(parseFloat(formData.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">رسوم المنصة (0.5%)</span>
                    <span className="font-medium text-red-600">- {formatCurrency(calculateFee())}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium text-gray-800">المبلغ المستلم</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatCurrency(calculateMerchantReceives())}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">ملاحظة مهمة</p>
                  <p>سيتم إرسال طلب الشراء للعميل للموافقة عليه. بعد الموافقة، سيتم تحويل المبلغ لحسابك.</p>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !formData.amount || parseFloat(formData.amount) > customer.available_limit}
              className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaCheck className="ml-2" />
                  إرسال طلب الشراء
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default NewTransaction
