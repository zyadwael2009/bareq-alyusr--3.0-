# بارق اليسر - الواجهة الأمامية
# Bareq Al-Yusr Frontend

واجهة المستخدم الأمامية لنظام بارق اليسر للدفع بالتقسيط.

## التقنيات المستخدمة

- **React 18** - مكتبة JavaScript لبناء واجهات المستخدم
- **Vite** - أداة بناء سريعة للتطوير
- **Tailwind CSS** - إطار عمل CSS للتصميم
- **React Router v6** - التنقل بين الصفحات
- **Axios** - مكتبة للتعامل مع HTTP requests
- **React Icons** - مكتبة الأيقونات
- **React Toastify** - الإشعارات
- **Recharts** - الرسوم البيانية

## التثبيت

```bash
cd frontend
npm install
```

## التشغيل

### وضع التطوير
```bash
npm run dev
```

التطبيق سيعمل على: http://localhost:3000

### البناء للإنتاج
```bash
npm run build
```

## البنية

```
frontend/
├── src/
│   ├── context/          # React Context للحالة العامة
│   │   └── AuthContext.jsx
│   ├── layouts/          # تخطيطات الصفحات
│   │   ├── MainLayout.jsx
│   │   ├── AuthLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/            # صفحات التطبيق
│   │   ├── Home.jsx
│   │   ├── auth/         # صفحات المصادقة
│   │   ├── customer/     # صفحات العميل
│   │   ├── merchant/     # صفحات التاجر
│   │   └── admin/        # صفحات المشرف
│   ├── services/         # خدمات API
│   │   └── api.js
│   ├── App.jsx           # المكون الرئيسي
│   ├── main.jsx          # نقطة الدخول
│   └── index.css         # الأنماط العامة
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## الصفحات

### صفحات عامة
- `/` - الصفحة الرئيسية
- `/login` - تسجيل الدخول
- `/register/customer` - تسجيل عميل جديد
- `/register/merchant` - تسجيل تاجر جديد

### صفحات العميل
- `/customer` - لوحة تحكم العميل
- `/customer/transactions` - المعاملات
- `/customer/repayments` - خطط السداد
- `/customer/profile` - الملف الشخصي

### صفحات التاجر
- `/merchant` - لوحة تحكم التاجر
- `/merchant/new-transaction` - معاملة جديدة
- `/merchant/transactions` - المعاملات
- `/merchant/profile` - الملف الشخصي

### صفحات المشرف
- `/admin/login` - دخول المشرف
- `/admin` - لوحة التحكم
- `/admin/customers` - إدارة العملاء
- `/admin/merchants` - إدارة التجار
- `/admin/transactions` - المعاملات

## الاتصال بالخادم

التطبيق يتصل بالخادم الخلفي على المنفذ 8000. 
الـ Vite proxy يحول الطلبات من `/api` إلى `http://localhost:8000`.

## المميزات

### للعملاء
- عرض الحد الائتماني والمتاح
- الموافقة أو رفض طلبات الشراء
- اختيار خطة السداد (1-28 شهر)
- عرض وإدارة خطط السداد
- دفع الأقساط

### للتجار
- البحث عن العملاء برقم الهاتف
- إنشاء طلبات شراء جديدة
- عرض المعاملات وحالتها
- عرض الرصيد والأرباح

### للمشرفين
- إحصائيات شاملة
- الموافقة على العملاء وتحديد الحد الائتماني
- الموافقة على التجار
- عرض جميع المعاملات
