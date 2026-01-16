import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  FaUser, FaEnvelope, FaPhone, FaLock, FaStore, FaFileAlt, 
  FaMapMarkerAlt, FaCity, FaSpinner, FaUniversity, FaCreditCard 
} from 'react-icons/fa'

const RegisterMerchant = () => {
  const { registerMerchant } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    commercial_registration: '',
    tax_number: '',
    business_category: '',
    business_address: '',
    city: '',
    bank_name: '',
    iban: ''
  })
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('كلمات المرور غير متطابقة')
      return
    }
    
    setLoading(true)
    const { confirmPassword, ...data } = formData
    await registerMerchant(data)
    setLoading(false)
  }
  
  const businessCategories = [
    'إلكترونيات',
    'أجهزة منزلية',
    'أثاث',
    'ملابس',
    'مجوهرات',
    'سيارات',
    'أخرى'
  ]
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
        تسجيل حساب تاجر
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Info */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">المعلومات الشخصية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                الاسم الكامل *
              </label>
              <div className="relative">
                <FaUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                رقم الهاتف *
              </label>
              <div className="relative">
                <FaPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              البريد الإلكتروني *
            </label>
            <div className="relative">
              <FaEnvelope className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Business Info */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">معلومات النشاط التجاري</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                اسم المتجر *
              </label>
              <div className="relative">
                <FaStore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                السجل التجاري *
              </label>
              <div className="relative">
                <FaFileAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="commercial_registration"
                  value={formData.commercial_registration}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                الرقم الضريبي
              </label>
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                نوع النشاط
              </label>
              <select
                name="business_category"
                value={formData.business_category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="">اختر نوع النشاط</option>
                {businessCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                المدينة
              </label>
              <div className="relative">
                <FaCity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                عنوان المتجر
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bank Info */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">المعلومات البنكية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                اسم البنك
              </label>
              <div className="relative">
                <FaUniversity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                رقم الآيبان
              </label>
              <div className="relative">
                <FaCreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="SA..."
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              كلمة المرور *
            </label>
            <div className="relative">
              <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                minLength={8}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              تأكيد كلمة المرور *
            </label>
            <div className="relative">
              <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary-600 text-white py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin ml-2" />
              جاري التسجيل...
            </>
          ) : (
            'إنشاء الحساب'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterMerchant
