import { useState, useEffect } from 'react'
import { merchantAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaStore, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaCity, FaEdit, FaCheck, FaUniversity, FaCreditCard, FaFileAlt 
} from 'react-icons/fa'

const MerchantProfile = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    tax_number: '',
    business_category: '',
    business_address: '',
    city: '',
    bank_name: '',
    iban: ''
  })
  
  useEffect(() => {
    loadProfile()
  }, [])
  
  const loadProfile = async () => {
    try {
      const data = await merchantAPI.getProfile()
      setProfile(data)
      setFormData({
        business_name: data.business_name || '',
        tax_number: data.tax_number || '',
        business_category: data.business_category || '',
        business_address: data.business_address || '',
        city: data.city || '',
        bank_name: data.bank_name || '',
        iban: data.iban || ''
      })
    } catch (error) {
      toast.error('خطأ في تحميل الملف الشخصي')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await merchantAPI.updateProfile(formData)
      setProfile(updated)
      setEditing(false)
      toast.success('تم تحديث الملف الشخصي بنجاح')
    } catch (error) {
      toast.error('خطأ في تحديث الملف الشخصي')
    } finally {
      setSaving(false)
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">الملف الشخصي</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaEdit className="ml-2" />
            تعديل
          </button>
        )}
      </div>
      
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-secondary-600 to-secondary-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <FaStore className="text-3xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.business_name}</h2>
              <p className="text-secondary-100">{profile?.full_name}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                profile?.is_approved 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {profile?.is_approved ? 'حساب مفعل' : 'بانتظار الموافقة'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {editing ? (
            <div className="space-y-6">
              {/* Business Info */}
              <div>
                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">معلومات النشاط التجاري</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">اسم المتجر</label>
                    <div className="relative">
                      <FaStore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">نوع النشاط</label>
                    <input
                      type="text"
                      value={formData.business_category}
                      onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">الرقم الضريبي</label>
                    <input
                      type="text"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">المدينة</label>
                    <div className="relative">
                      <FaCity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-500 mb-1">عنوان المتجر</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.business_address}
                        onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bank Info */}
              <div>
                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">المعلومات البنكية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">اسم البنك</label>
                    <div className="relative">
                      <FaUniversity className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">رقم الآيبان</label>
                    <div className="relative">
                      <FaCreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <><FaCheck className="ml-2" /> حفظ التغييرات</>}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      business_name: profile?.business_name || '',
                      tax_number: profile?.tax_number || '',
                      business_category: profile?.business_category || '',
                      business_address: profile?.business_address || '',
                      city: profile?.city || '',
                      bank_name: profile?.bank_name || '',
                      iban: profile?.iban || ''
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">معلومات التواصل</h3>
                
                <div className="flex items-start gap-3">
                  <FaEnvelope className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                    <p className="font-medium text-gray-800">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaPhone className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                    <p className="font-medium text-gray-800">{profile?.phone_number}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaCity className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">المدينة</p>
                    <p className="font-medium text-gray-800">{profile?.city || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">عنوان المتجر</p>
                    <p className="font-medium text-gray-800">{profile?.business_address || '-'}</p>
                  </div>
                </div>
              </div>
              
              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">معلومات النشاط</h3>
                
                <div className="flex items-start gap-3">
                  <FaFileAlt className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">السجل التجاري</p>
                    <p className="font-medium text-gray-800">{profile?.commercial_registration}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaStore className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">نوع النشاط</p>
                    <p className="font-medium text-gray-800">{profile?.business_category || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaUniversity className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">البنك</p>
                    <p className="font-medium text-gray-800">{profile?.bank_name || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaCreditCard className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">الآيبان</p>
                    <p className="font-medium text-gray-800" dir="ltr">{profile?.iban || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Financial Info */}
        <div className="border-t p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4">المعلومات المالية</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">الرصيد الحالي</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(profile?.balance)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">إجمالي الأرباح</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(profile?.total_earnings)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">إجمالي الرسوم</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(profile?.total_fees_paid)}</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 text-sm text-gray-500">
          <p>تاريخ التسجيل: {formatDate(profile?.created_at)}</p>
          {profile?.approved_at && (
            <p>تاريخ الموافقة: {formatDate(profile?.approved_at)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MerchantProfile
