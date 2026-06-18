import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import i18n from '../i18n'
import { message } from 'antd'

interface ApiError extends Error {
  errorCode?: string
  _handled?: boolean
  response?: { data: unknown; status: number }
  request?: unknown
}

function normaliseUrl(raw: string | undefined, fallback: string): string {
  if (raw && raw.trim() !== '') {
    const trimmed = raw.trim()
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `http://${trimmed}`
  }
  return fallback
}

const API_BASE_URL     = normaliseUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8080/api/v1')
const ACL_API_BASE_URL = normaliseUrl(import.meta.env.VITE_ACL_API_BASE_URL, API_BASE_URL)

function makeClient(baseURL: string): AxiosInstance {
  return axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })
}

function attachInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem('kc_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      config.headers['Accept-Language'] = localStorage.getItem('i18nextLng') || 'vi'
      // TODO: remove before production — temporary header for backend testing
      config.headers['X-User-Id'] = '6FCD264E878349EF9C5B32A6DA90448C'
      return config
    },
    (error) => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response) => response,
    async (error: ApiError) => {
      if (error.response) {
        const { data, status } = error.response

        if (data && typeof data === 'object' && 'message' in data) {
          error.message = (data as { message: string }).message
        } else if (typeof data === 'string') {
          error.message = data
        } else {
          const msgs: Record<number, string> = {
            400: i18n.t('api_error.400'), 401: i18n.t('api_error.401'),
            403: i18n.t('api_error.403'), 404: i18n.t('api_error.404'),
            409: i18n.t('api_error.409'), 500: i18n.t('api_error.500'),
          }
          error.message = msgs[status] ?? `${i18n.t('app.error')} (${status})`
        }

        if (data && typeof data === 'object' && 'errorCode' in data) {
          const errorCode = (data as { errorCode: string }).errorCode
          error.errorCode = errorCode
          const key = `error.${errorCode.toLowerCase()}`
          const translated = i18n.t(key)
          if (translated && translated !== key) {
            message.error(translated)
            error._handled = true
          }
        }

        if (status === 403 && !error._handled) {
          const msg = i18n.t('api_error.403')
          message.destroy()
          message.error(msg)
          error.message = msg
          error._handled = true
        }
      } else if (error.request) {
        error.message = i18n.t('api_error.network')
      }

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

export const get    = async <T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.get<T>(endpoint, config)).data

export const post   = async <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.post<T>(endpoint, data, config)).data

export const put    = async <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.put<T>(endpoint, data, config)).data

export const patch  = async <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.patch<T>(endpoint, data, config)).data

export const del    = async <T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.delete<T>(endpoint, config)).data

export const aclGet = async <T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<T> =>
  (await aclApiClient.get<T>(endpoint, config)).data

export { apiClient, aclApiClient }
