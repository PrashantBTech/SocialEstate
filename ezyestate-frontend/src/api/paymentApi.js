import api from './axios'
export const verifyPayment = (data)   => api.post('/payments/verify', data)
export const getMyPayments = ()       => api.get('/payments/my-payments')
