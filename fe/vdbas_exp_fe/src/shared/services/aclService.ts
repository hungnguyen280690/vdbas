import { get, aclGet, post, put, del } from './api'
import type {
  CategoryGroupRecord,
  CategoryGroupPayload,
  MenuItem,
  ApiPermission,
  PagedResponse,
} from '@/shared/types/index'

const APP_CODE = import.meta.env.VITE_APP_CODE

export const getMyMenus = (): Promise<MenuItem[]>          => aclGet(`/me/menus?appCode=${APP_CODE}`)
export const getMyApis  = (): Promise<ApiPermission[]>     => aclGet(`/me/apis?appCode=${APP_CODE}`)

export const listCategoryGroups        = (params = {}): Promise<PagedResponse<CategoryGroupRecord>> => post('/category-groups/search', params)
export const getCategoryGroup          = (groupCode: string): Promise<CategoryGroupRecord>          => get(`/category-groups/${groupCode}`)
export const createCategoryGroup       = (data: CategoryGroupPayload): Promise<CategoryGroupRecord> => post('/category-groups', data)
export const updateCategoryGroup       = (groupCode: string, data: CategoryGroupPayload): Promise<CategoryGroupRecord> => put(`/category-groups/${groupCode}`, data)
export const updateCategoryGroupActive = (groupCode: string, isActive: boolean): Promise<CategoryGroupRecord> => put(`/category-groups/${groupCode}/active`, isActive)
export const deleteCategoryGroup       = (groupCode: string): Promise<void>                         => del(`/category-groups/${groupCode}`)
