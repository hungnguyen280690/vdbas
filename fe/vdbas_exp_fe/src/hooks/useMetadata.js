import { useQuery } from '@tanstack/react-query'
import { metadataService } from '../services/metadataService.js'

/**
 * Fetches attribute metadata for a given scope.
 * Used by DynamicExtAttributes to know what field types to render.
 *
 * @param {string} scope - e.g. 'CATEGORY', 'ORGANIZATION_PROFILE'
 */
export const useAttributeMetadata = (scope) => {
  return useQuery({
    queryKey: ['attributeMetadata', scope],
    queryFn:  () => metadataService.getAttributeMetadata(scope),
    enabled:  !!scope,
    staleTime: 5 * 60 * 1000, // 5 min — metadata rarely changes
  })
}
