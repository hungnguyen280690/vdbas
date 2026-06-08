import { get, post, put, del } from '@/shared/api/api'

// ── Category Groups API ───────────────────────────────────────────────────────
// Uses POST /search for list (body-based filtering) — note: not GET with query params.

export const listCategoryGroups        = (params = {})           => post('/category-groups/search', params)
export const getCategoryGroup          = (groupCode: string)             => get(`/category-groups/${groupCode}`)
export const createCategoryGroup       = (data: any)                  => post('/category-groups', data)
export const updateCategoryGroup       = (groupCode: string, data: any)       => put(`/category-groups/${groupCode}`, data)
export const updateCategoryGroupActive = (groupCode: string, isActive: boolean)   => put(`/category-groups/${groupCode}/active`, isActive)
export const deleteCategoryGroup       = (groupCode: string)             => del(`/category-groups/${groupCode}`)
