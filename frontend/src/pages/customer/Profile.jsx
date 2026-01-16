import { useState, useEffect } from 'react'
import { customerAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { 
  FaSpinner, FaUser, FaIdCard, FaEnvelope, FaPhone, 
  FaMapMarkerAlt, FaCity, FaEdit, FaCheck 
} from 'react-icons/fa'

const CustomerProfile = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    address: '',
    city: ''
  })
  
  useEffect(() => {
    loadProfile()
  }, [])
  
  const loadProfile = async () => {
    try {
      const data = await customerAPI.getProfile()
      setProfile(data)
      setFormData({
        address: data.address || '',
        city: data.city || ''
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
      const updated = await customerAPI.updateProfile(formData)
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
    <div className="space-y-6 max-w-3xl mx-auto">
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
        <div className="bg-gradient-to-l from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <FaUser className="text-3xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
              <p className="text-primary-100">عميل</p>
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
        
        {/* Info */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Read-only Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">المعلومات الأساسية</h3>
              
              <div className="flex items-start gap-3">
                <FaIdCard className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">رقم الهوية</p>
                  <p className="font-medium text-gray-800">{profile?.national_id}</p>
                </div>
              </div>
              
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
            </div>
            
            {/* Editable Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">معلومات العنوان</h3>
              
              {editing ? (
                <>
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
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">العنوان</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {saving ? <FaSpinner className="animate-spin" /> : <><FaCheck className="ml-2" /> حفظ</>}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          address: profile?.address || '',
                          city: profile?.city || ''
                        })
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                      <p className="text-sm text-gray-500">العنوان</p>
                      <p className="font-medium text-gray-800">{profile?.address || '-'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Credit Info */}
        <div className="border-t p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4">معلومات الائتمان</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">الحد الائتماني</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(profile?.credit_limit)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">المتاح</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(profile?.available_limit)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">المستخدم</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(profile?.used_limit)}</p>
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

export default CustomerProfile
