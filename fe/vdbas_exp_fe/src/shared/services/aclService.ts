import { aclGet } from '@/shared/api/api'

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
