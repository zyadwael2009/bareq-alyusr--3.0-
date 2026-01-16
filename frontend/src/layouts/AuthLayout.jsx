import { Outlet, Link } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-white mb-2">بارق اليسر</h1>
            <p className="text-primary-200">اشتر الآن وادفع لاحقاً</p>
          </Link>
        </div>
        
        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-primary-200 text-sm">
          <p>© 2024 بارق اليسر. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
