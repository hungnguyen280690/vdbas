import { get, aclGet, post, put, del } from './api.js'

/**
 * Helper: builds a query string from a params object, skipping null/undefined/'' values.
 */
function buildQuery(basePath, params = {}) {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value)
    }
  })
  const queryString = queryParams.toString()
  return `${basePath}${queryString ? `?${queryString}` : ''}`
}

// ── Permission & menu endpoints (required by PermissionContext) ───────────────

/**
 * Returns the menu tree for the currently authenticated user.
 */
const APP_CODE = import.meta.env.VITE_APP_CODE

export const getMyMenus = () => aclGet(`/me/menus?appCode=${APP_CODE}`)

/**
 * Returns the list of API permissions for the currently authenticated user.
 */
export const getMyApis = () => aclGet(`/me/apis?appCode=${APP_CODE}`)

// ── Add domain-specific service functions below this line ────────────────────
// Follow the patterns defined in CODING_RULES.md §5:
//
//   export const listEntities  = (params = {}) => get(buildQuery('/entities', params))
//   export const getEntity     = (id)           => get(`/entities/${id}`)
//   export const createEntity  = (data)         => post('/entities', data)
//   export const updateEntity  = (id, data)     => put(`/entities/${id}`, data)
//   export const deleteEntity  = (id)           => del(`/entities/${id}`)

// ── Category Groups ───────────────────────────────────────────────────────────
// Uses POST /search for list (body-based filtering) — note: not GET with query params.

export const listCategoryGroups        = (params = {})           => post('/category-groups/search', params)
export const getCategoryGroup          = (groupCode)             => get(`/category-groups/${groupCode}`)
export const createCategoryGroup       = (data)                  => post('/category-groups', data)
export const updateCategoryGroup       = (groupCode, data)       => put(`/category-groups/${groupCode}`, data)
export const updateCategoryGroupActive = (groupCode, isActive)   => put(`/category-groups/${groupCode}/active`, isActive)
export const deleteCategoryGroup       = (groupCode)             => del(`/category-groups/${groupCode}`)
