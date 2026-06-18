import { useQuery } from '@tanstack/react-query'
import {
  lovProjects, lovProjectSpecific, lovTreasuries, lovInvestors, lovOrganizations,
  lovProjectManagement, lovDataSources, lovDocumentTypes, lovAttachmentTypes,
} from '../services/lovService'
import type {
  ProjectLovParams, ProjectLovItem, ProjectSpecificLovItem,
  TreasuryLovItem, InvestorLovItem, OrganizationLovItem, ProjectManagementLovItem, ProjectManagementLovParams,
  DataSourceItem, DocumentTypeItem, AttachmentTypeItem,
} from '@/types/index'

const KEY = 'lov'
const LONG = 10 * 60 * 1000 // danh mục ổn định — staleTime dài

export const LovHooks = {
  useProjects: (params: ProjectLovParams = {}, enabled = true) =>
    useQuery<ProjectLovItem[]>({
      queryKey: [KEY, 'projects', params],
      queryFn:  () => lovProjects(params),
      enabled,
      staleTime: 5 * 60 * 1000,
    }),

  useProjectSpecific: (projectCode: string | undefined) =>
    useQuery<ProjectSpecificLovItem[]>({
      queryKey: [KEY, 'project-specific', projectCode],
      queryFn:  () => lovProjectSpecific(projectCode!),
      enabled:  !!projectCode,
      staleTime: 5 * 60 * 1000,
    }),

  useTreasuries: (search?: string) =>
    useQuery<TreasuryLovItem[]>({
      queryKey: [KEY, 'treasuries', search],
      queryFn:  () => lovTreasuries(search),
      staleTime: LONG,
    }),

  useInvestors: (search?: string) =>
    useQuery<InvestorLovItem[]>({
      queryKey: [KEY, 'investors', search],
      queryFn:  () => lovInvestors(search),
      staleTime: 5 * 60 * 1000,
    }),

  useOrganizations: (search?: string) =>
    useQuery<OrganizationLovItem[]>({
      queryKey: [KEY, 'organizations', search],
      queryFn:  () => lovOrganizations(search),
      staleTime: 5 * 60 * 1000,
    }),

  useProjectManagement: (params: ProjectManagementLovParams = {}) =>
    useQuery<ProjectManagementLovItem[]>({
      queryKey: [KEY, 'project-management', params],
      queryFn:  () => lovProjectManagement(params),
      staleTime: 5 * 60 * 1000,
    }),

  useDataSources: () =>
    useQuery<DataSourceItem[]>({
      queryKey: [KEY, 'data-sources'],
      queryFn:  () => lovDataSources(),
      staleTime: LONG,
    }),

  useDocumentTypes: () =>
    useQuery<DocumentTypeItem[]>({
      queryKey: [KEY, 'document-types'],
      queryFn:  () => lovDocumentTypes(),
      staleTime: LONG,
    }),

  useAttachmentTypes: () =>
    useQuery<AttachmentTypeItem[]>({
      queryKey: [KEY, 'attachment-types'],
      queryFn:  () => lovAttachmentTypes(),
      staleTime: LONG,
    }),
}
