import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import i18n from '../i18n'
import {
  listCategoryGroups, getCategoryGroup, createCategoryGroup,
  updateCategoryGroup, updateCategoryGroupActive, deleteCategoryGroup,
} from '../services/aclService'
import type {
  CategoryGroupRecord, CategoryGroupPayload,
  PagedResponse, MutationHookOptions,
} from '@/types/index'

type UpdateVariables = CategoryGroupPayload & { groupCode: string }
type UpdateActiveVariables = { groupCode: string; isActive: boolean }

export const CategoryGroupsHooks = {
  useList: (params = {}) =>
    useQuery<PagedResponse<CategoryGroupRecord>>({
      queryKey: ['category-groups', 'list', params],
      queryFn:  () => listCategoryGroups(params),
      staleTime: 30 * 1000,
    }),

  useDetail: (groupCode: string | undefined) =>
    useQuery<CategoryGroupRecord>({
      queryKey: ['category-groups', 'detail', groupCode],
      queryFn:  () => getCategoryGroup(groupCode!),
      enabled:  !!groupCode,
      staleTime: 30 * 1000,
    }),

  useCreate: (options: MutationHookOptions<CategoryGroupRecord, CategoryGroupPayload> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<CategoryGroupRecord, Error, CategoryGroupPayload>({
      mutationFn: (data) => createCategoryGroup(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        if (!skipNotification) message.success(i18n.t('common.create_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useUpdate: (options: MutationHookOptions<CategoryGroupRecord, UpdateVariables> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<CategoryGroupRecord, Error, UpdateVariables>({
      mutationFn: (variables) => updateCategoryGroup(variables.groupCode, variables),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        qc.invalidateQueries({ queryKey: ['category-groups', 'detail', variables.groupCode] })
        if (!skipNotification) message.success(i18n.t('common.update_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useUpdateActive: (options: MutationHookOptions<CategoryGroupRecord, UpdateActiveVariables> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<CategoryGroupRecord, Error, UpdateActiveVariables>({
      mutationFn: ({ groupCode, isActive }) => updateCategoryGroupActive(groupCode, isActive),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        qc.invalidateQueries({ queryKey: ['category-groups', 'detail', variables.groupCode] })
        if (!skipNotification) message.success(i18n.t('common.update_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useDelete: (options: MutationHookOptions<void, string> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<void, Error, string>({
      mutationFn: (groupCode) => deleteCategoryGroup(groupCode),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['category-groups'] })
        if (!skipNotification) message.success(i18n.t('common.delete_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },
}
