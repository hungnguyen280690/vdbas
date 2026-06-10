import type { AttributeMetadata } from '@/types/index'

export const metadataService = {
  getAttributeMetadata: async (_scope: string): Promise<AttributeMetadata[]> => {
    // TODO: replace with real API: return get(`/attribute-metadata?scope=${_scope}`)
    return []
  },
}
