import { Link } from 'react-router-dom'
import { FaShoppingCart, FaCreditCard, FaCalendarCheck, FaShieldAlt, FaStore, FaUsers } from 'react-icons/fa'

const Home = () => {
  const features = [
    {
      icon: <FaShoppingCart className="w-12 h-12 text-primary-600" />,
      title: 'اشتر الآن',
      description: 'اشترِ ما تحتاجه من المتاجر المشاركة بكل سهولة'
    },
    {
      icon: <FaCreditCard className="w-12 h-12 text-primary-600" />,
      title: 'ادفع لاحقاً',
      description: 'قسّط مشترياتك على فترة تصل إلى 28 شهراً'
    },
    {
      icon: <FaCalendarCheck className="w-12 h-12 text-primary-600" />,
      title: 'دفعات مرنة',
      description: 'اختر خطة السداد المناسبة لك بدون فوائد'
    },
    {
      icon: <FaShieldAlt className="w-12 h-12 text-primary-600" />,
      title: 'آمن وموثوق',
      description: 'نظام آمن ومحمي لجميع معاملاتك'
    },
  ]
  
  return (
    <div className="-mt-8 -mx-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-800 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            بارق اليسر
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
            منصة التقسيط الذكية - اشتر الآن وادفع لاحقاً بكل سهولة وأمان
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register/customer"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <FaUsers className="inline ml-2" />
              سجل كعميل
            </Link>
            <Link
              to="/register/merchant"
              className="bg-primary-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-primary-400 transition-colors shadow-lg border border-primary-400"
            >
              <FaStore className="inline ml-2" />
              سجل كتاجر
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            لماذا تختار بارق اليسر؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-gray-50 card-hover"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            كيف يعمل؟
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              {/* For Customers */}
              <div className="flex-1 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-primary-600 mb-4 text-center">
                  للعملاء
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start">
                    <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">1</span>
                    <span>سجل حساباً جديداً وانتظر الموافقة</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">2</span>
                    <span>تسوق من المتاجر المشاركة</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">3</span>
                    <span>وافق على طلب الشراء واختر خطة السداد</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">4</span>
                    <span>سدد أقساطك الشهرية بسهولة</span>
                  </li>
                </ol>
              </div>
              
              {/* For Merchants */}
              <div className="flex-1 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-secondary-600 mb-4 text-center">
                  للتجار
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start">
                    <span className="bg-secondary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">1</span>
                    <span>سجل متجرك وانتظر الموافقة</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-secondary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">2</span>
                    <span>ابحث عن العميل برقم الهاتف</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-secondary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">3</span>
                    <span>أرسل طلب الشراء للعميل</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-secondary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold ml-3 flex-shrink-0">4</span>
                    <span>استلم المبلغ فور موافقة العميل</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary-700 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            ابدأ الآن مع بارق اليسر
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            انضم إلى آلاف العملاء والتجار الذين يستخدمون منصتنا
          </p>
          <Link
            to="/login"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg inline-block"
          >
            تسجيل الدخول
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
