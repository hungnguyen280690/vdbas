import { useQuery } from '@tanstack/react-query'
import { metadataService } from '@/shared/services/metadataService'
import type { AttributeMetadata } from '@/shared/types/index'

export const useAttributeMetadata = (scope: string | undefined) =>
  useQuery<AttributeMetadata[]>({
    queryKey: ['attributeMetadata', scope],
    queryFn:  () => metadataService.getAttributeMetadata(scope!),
    enabled:  !!scope,
    staleTime: 5 * 60 * 1000,
  })
