import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import i18n from '../i18n.js'
import {
  listCategoryGroups,
  getCategoryGroup,
  createCategoryGroup,
  updateCategoryGroup,
  updateCategoryGroupActive,
  deleteCategoryGroup,
} from '../services/aclService.js'

// ── Category Groups ───────────────────────────────────────────────────────────

export const CategoryGroupsHooks = {
  useList: (params = {}) =>
    useQuery({
      queryKey: ['category-groups', 'list', params],
      queryFn:  () => listCategoryGroups(params),
      staleTime: 30 * 1000,
    }),

  useDetail: (groupCode) =>
    useQuery({
      queryKey: ['category-groups', 'detail', groupCode],
      queryFn:  () => getCategoryGroup(groupCode),
      enabled:  !!groupCode,
      staleTime: 30 * 1000,
    }),

  useCreate: (options = {}) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (data) => createCategoryGroup(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        if (!options.skipNotification) {
          message.success(i18n.t('common.create_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },

  useUpdate: (options = {}) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (variables) => updateCategoryGroup(variables.groupCode, variables),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        qc.invalidateQueries({ queryKey: ['category-groups', 'detail', variables.groupCode] })
        if (!options.skipNotification) {
          message.success(i18n.t('common.update_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },

  useUpdateActive: (options = {}) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ groupCode, isActive }) => updateCategoryGroupActive(groupCode, isActive),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        qc.invalidateQueries({ queryKey: ['category-groups', 'detail', variables.groupCode] })
        if (!options.skipNotification) {
          message.success(i18n.t('common.update_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },

  useDelete: (options = {}) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (groupCode) => deleteCategoryGroup(groupCode),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        if (!options.skipNotification) {
          message.success(i18n.t('common.delete_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },
}

// ── Add more hook groups below as you extend the project ─────────────────────
// Example:
//
// export const UsersHooks = {
//   useList:   (params = {}) => useQuery({ ... }),
//   useCreate: (options = {}) => { const qc = useQueryClient(); return useMutation({ ... }) },
//   useUpdate: (options = {}) => { ... },
//   useDelete: (options = {}) => { ... },
// }
