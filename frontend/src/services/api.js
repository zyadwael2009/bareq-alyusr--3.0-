import axios from 'axios'

const API_BASE_URL = '/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const params = new URLSearchParams()
    params.append('email', email)
    params.append('password', password)
    const response = await api.post('/auth/login', null, { params })
    return response.data
  },
  
  registerCustomer: async (data) => {
    const params = new URLSearchParams()
    Object.keys(data).forEach(key => {
      if (data[key]) params.append(key, data[key])
    })
    const response = await api.post('/auth/register/customer', null, { params })
    return response.data
  },
  
  registerMerchant: async (data) => {
    const params = new URLSearchParams()
    Object.keys(data).forEach(key => {
      if (data[key]) params.append(key, data[key])
    })
    const response = await api.post('/auth/register/merchant', null, { params })
    return response.data
  },
}

// Customer APIs
export const customerAPI = {
  getProfile: async () => {
    const response = await api.get('/customers/me')
    return response.data
  },
  
  getCreditLimit: async () => {
    const response = await api.get('/customers/me/limit')
    return response.data
  },
  
  updateProfile: async (data) => {
    const params = new URLSearchParams()
    Object.keys(data).forEach(key => {
      if (data[key]) params.append(key, data[key])
    })
    const response = await api.put('/customers/me', null, { params })
    return response.data
  },
  
  getPendingTransactions: async () => {
    const response = await api.get('/customers/me/pending-transactions')
    return response.data
  },
  
  getTransactionHistory: async () => {
    const response = await api.get('/customers/me/transactions/history')
    return response.data
  },
  
  approveTransaction: async (transactionId, numberOfMonths) => {
    const params = new URLSearchParams()
    params.append('number_of_months', numberOfMonths)
    const response = await api.post(`/transactions/${transactionId}/approve`, null, { params })
    return response.data
  },
  
  rejectTransaction: async (transactionId, reason) => {
    const params = new URLSearchParams()
    if (reason) params.append('reason', reason)
    const response = await api.post(`/transactions/${transactionId}/reject`, null, { params })
    return response.data
  },
  
  getRepaymentPlans: async (status = null) => {
    const params = status ? { status } : {}
    const response = await api.get('/repayments/plans', { params })
    return response.data
  },
  
  getRepaymentPlan: async (planId) => {
    const response = await api.get(`/repayments/plans/${planId}`)
    return response.data
  },
  
  requestPayment: async (scheduleId) => {
    const response = await api.post(`/repayments/schedules/${scheduleId}/request-payment`)
    return response.data
  },
  
  makePayment: async (planId, amount) => {
    const params = new URLSearchParams()
    params.append('amount', amount)
    const response = await api.post(`/repayments/plans/${planId}/pay`, null, { params })
    return response.data
  },
  
  getUpcomingPayments: async () => {
    const response = await api.get('/repayments/upcoming')
    return response.data
  },
  
  getPaymentSummary: async () => {
    const response = await api.get('/repayments/summary')
    return response.data
  },
}

// Merchant APIs
export const merchantAPI = {
  getProfile: async () => {
    const response = await api.get('/merchants/me')
    return response.data
  },
  
  getBalance: async () => {
    const response = await api.get('/merchants/me/balance')
    return response.data
  },
  
  updateProfile: async (data) => {
    const params = new URLSearchParams()
    Object.keys(data).forEach(key => {
      if (data[key]) params.append(key, data[key])
    })
    const response = await api.put('/merchants/me', null, { params })
    return response.data
  },
  
  searchCustomer: async (customerId) => {
    const params = new URLSearchParams()
    params.append('customer_id', customerId)
    const response = await api.get('/merchants/search-customer-by-id', { params })
    return response.data
  },
  
  createTransaction: async (data) => {
    const params = new URLSearchParams()
    params.append('customer_id', data.customer_id)
    params.append('amount', data.amount)
    if (data.description) params.append('description', data.description)
    if (data.product_name) params.append('product_name', data.product_name)
    const response = await api.post('/transactions/', null, { params })
    return response.data
  },
  
  getTransactions: async (status = null) => {
    const params = status ? { status } : {}
    const response = await api.get('/merchants/me/transactions', { params })
    return response.data
  },
  
  getPaymentRequests: async () => {
    const response = await api.get('/merchants/me/payment-requests')
    return response.data
  },
  
  approvePaymentRequest: async (scheduleId) => {
    const response = await api.post(`/merchants/payment-requests/${scheduleId}/approve`)
    return response.data
  },
  
  rejectPaymentRequest: async (scheduleId, reason) => {
    const params = new URLSearchParams()
    if (reason) params.append('reason', reason)
    const response = await api.post(`/merchants/payment-requests/${scheduleId}/reject`, null, { params })
    return response.data
  },
  
  cancelTransaction: async (transactionId, reason) => {
    const params = new URLSearchParams()
    if (reason) params.append('reason', reason)
    const response = await api.post(`/transactions/${transactionId}/cancel`, null, { params })
    return response.data
  },
}

// Admin APIs
export const adminAPI = {
  login: async (email, password) => {
    const params = new URLSearchParams()
    params.append('email', email)
    params.append('password', password)
    const response = await api.post('/admin/login', null, { params })
    return response.data
  },
  
  getDashboard: async () => {
    const token = localStorage.getItem('token')
    const response = await api.get('/admin/dashboard', {
      params: { authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  getCustomers: async (status = null) => {
    const token = localStorage.getItem('token')
    const params = { authorization: `Bearer ${token}` }
    if (status) params.status = status
    const response = await api.get('/admin/customers', { params })
    return response.data
  },
  
  approveCustomer: async (customerId, creditLimit) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('authorization', `Bearer ${token}`)
    params.append('credit_limit', creditLimit)
    const response = await api.post(`/admin/customers/${customerId}/approve`, null, { params })
    return response.data
  },
  
  rejectCustomer: async (customerId, reason) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('authorization', `Bearer ${token}`)
    if (reason) params.append('reason', reason)
    const response = await api.post(`/admin/customers/${customerId}/reject`, null, { params })
    return response.data
  },
  
  updateCreditLimit: async (customerId, creditLimit) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('authorization', `Bearer ${token}`)
    params.append('new_credit_limit', creditLimit)
    const response = await api.put(`/admin/customers/${customerId}/credit-limit`, null, { params })
    return response.data
  },
  
  getMerchants: async (status = null) => {
    const token = localStorage.getItem('token')
    const params = { authorization: `Bearer ${token}` }
    if (status) params.status = status
    const response = await api.get('/admin/merchants', { params })
    return response.data
  },
  
  approveMerchant: async (merchantId) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('authorization', `Bearer ${token}`)
    const response = await api.post(`/admin/merchants/${merchantId}/approve`, null, { params })
    return response.data
  },
  
  rejectMerchant: async (merchantId, reason) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('authorization', `Bearer ${token}`)
    if (reason) params.append('reason', reason)
    const response = await api.post(`/admin/merchants/${merchantId}/reject`, null, { params })
    return response.data
  },
  
  getTransactions: async (status = null) => {
    const token = localStorage.getItem('token')
    const params = { authorization: `Bearer ${token}` }
    if (status) params.status = status
    const response = await api.get('/admin/transactions', { params })
    return response.data
  },
}

export default api
