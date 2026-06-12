import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.error || 'Something went wrong'))
)

export const login = (email, password) => api.post('/auth/login', { email, password })
export const signup = (email, password, name) => api.post('/auth/signup', { email, password, name })
export const getMe = () => api.get('/auth/me')
export const generateSummary = (repoUrl, options = {}) =>
  api.post('/summary', {
    repoUrl,
    analysisMode: options.analysisMode || 'general',
    userPrompt: options.userPrompt || '',
  })
export const getHistory = () => api.get('/summary/history')
export const getSummary = (id) => api.get(`/summary/${id}`)
export const chatSummary = (id, prompt) => api.post(`/summary/${id}/chat`, { prompt })
export const deleteSummary = (id) => api.delete(`/summary/${id}`)

export default api
