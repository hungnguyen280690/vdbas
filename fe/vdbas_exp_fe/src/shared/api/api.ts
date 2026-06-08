import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import i18n from '@/app/i18n'
import { message } from 'antd'

function normaliseUrl(raw: string | undefined, fallback: string): string {
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    const trimmed = raw.trim()
    return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `http://${trimmed}`
  }
  return fallback
}

const API_BASE_URL = normaliseUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8080/api')
const ACL_API_BASE_URL = normaliseUrl(import.meta.env.VITE_ACL_API_BASE_URL, API_BASE_URL)

console.log('API_BASE_URL:', API_BASE_URL)
console.log('ACL_API_BASE_URL:', ACL_API_BASE_URL)

function makeClient(baseURL: string) {
  return axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })
}

function attachInterceptors(client: AxiosInstance) {
  // ── Request interceptor — inject Bearer token + Accept-Language ──────────────
  client.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem('kc_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      const language = localStorage.getItem('i18nextLng') || 'vi'
      config.headers['Accept-Language'] = language
      // TODO: remove before production — temporary header for backend testing
      config.headers['X-User-Id'] = '6FCD264E878349EF9C5B32A6DA90448C'
      return config
    },
    (error) => Promise.reject(error),
  )

  // ── Response interceptor — error normalisation + 401 token refresh ────────────
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response) {
        const { data, status } = error.response

        // 1. Extract message from backend
        if (data && data.message) {
          error.message = data.message
        } else if (typeof data === 'string') {
          error.message = data
        } else {
          switch (status) {
            case 400: error.message = i18n.t('api_error.400'); break
            case 401: error.message = i18n.t('api_error.401'); break
            case 403: error.message = i18n.t('api_error.403'); break
            case 404: error.message = i18n.t('api_error.404'); break
            case 409: error.message = i18n.t('api_error.409'); break
            case 500: error.message = i18n.t('api_error.500'); break
            default:  error.message = `${i18n.t('app.error')} (${status})`
          }
        }

        // 2. Handle errorCode — show global notification and mark as handled
        if (data && data.errorCode) {
          error.errorCode = data.errorCode
          const translationKey = `error.${data.errorCode.toLowerCase()}`
          const translatedMessage = i18n.t(translationKey)
          if (translatedMessage && translatedMessage !== translationKey) {
            message.error(translatedMessage)
            error._handled = true
          }
        }

        // 3. 403 fallback notification
        if (status === 403 && !error._handled) {
          const forbiddenMsg = i18n.t('api_error.403')
          message.destroy()
          message.error(forbiddenMsg)
          error.message = forbiddenMsg
          error._handled = true
        }
      } else if (error.request) {
        error.message = i18n.t('api_error.network')
      }

      // 4. Handle 401 (Unauthorized) - Redirect to host to re-authenticate
      if (error.response?.status === 401) {
        localStorage.removeItem('kc_token')
        localStorage.removeItem('kc_refreshToken')
        window.location.href = '/'
      }

      return Promise.reject(error)
    },
  )
}

const apiClient    = makeClient(API_BASE_URL)
const aclApiClient = makeClient(ACL_API_BASE_URL)

attachInterceptors(apiClient)
attachInterceptors(aclApiClient)

export const get = async (endpoint: string, config: AxiosRequestConfig = {}) => {
  const response = await apiClient.get(endpoint, config)
  return response.data
}

export const post = async (endpoint: string, data: any, config: AxiosRequestConfig = {}) => {
  const response = await apiClient.post(endpoint, data, config)
  return response.data
}

export const put = async (endpoint: string, data: any, config: AxiosRequestConfig = {}) => {
  const response = await apiClient.put(endpoint, data, config)
  return response.data
}

export const patch = async (endpoint: string, data: any, config: AxiosRequestConfig = {}) => {
  const response = await apiClient.patch(endpoint, data, config)
  return response.data
}

export const del = async (endpoint: string, config: AxiosRequestConfig = {}) => {
  const response = await apiClient.delete(endpoint, config)
  return response.data
}

export const aclGet = async (endpoint: string, config: AxiosRequestConfig = {}) => {
  const response = await aclApiClient.get(endpoint, config)
  return response.data
}

export { apiClient, aclApiClient }
