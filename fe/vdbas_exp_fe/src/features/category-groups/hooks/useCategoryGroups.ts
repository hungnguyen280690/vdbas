import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  listCategoryGroups,
  getCategoryGroup,
  createCategoryGroup,
  updateCategoryGroup,
  updateCategoryGroupActive,
  deleteCategoryGroup,
} from '../services/categoryGroupsApi'

export const useCategoryGroups = {
  useList: (params = {}) =>
    useQuery({
      queryKey: ['category-groups', 'list', params],
      queryFn:  () => listCategoryGroups(params),
      staleTime: 30 * 1000,
    }),

  useDetail: (groupCode: string) =>
    useQuery({
      queryKey: ['category-groups', 'detail', groupCode],
      queryFn:  () => getCategoryGroup(groupCode),
      enabled:  !!groupCode,
      staleTime: 30 * 1000,
    }),

  useCreate: (options: any = {}) => {
    const qc = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
      mutationFn: (data) => createCategoryGroup(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        if (!options.skipNotification) {
          message.success(t('common.create_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },

  useUpdate: (options: any = {}) => {
    const qc = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
      mutationFn: (variables: any) => updateCategoryGroup(variables.groupCode, variables),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        qc.invalidateQueries({ queryKey: ['category-groups', 'detail', variables.groupCode] })
        if (!options.skipNotification) {
          message.success(t('common.update_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },

  useUpdateActive: (options: any = {}) => {
    const qc = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
      mutationFn: ({ groupCode, isActive }: { groupCode: string; isActive: boolean }) => 
        updateCategoryGroupActive(groupCode, isActive),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        qc.invalidateQueries({ queryKey: ['category-groups', 'detail', variables.groupCode] })
        if (!options.skipNotification) {
          message.success(t('common.update_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },

  useDelete: (options: any = {}) => {
    const qc = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
      mutationFn: (groupCode: string) => deleteCategoryGroup(groupCode),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        if (!options.skipNotification) {
          message.success(t('common.delete_success'))
        }
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
      ...options,
    })
  },
}
