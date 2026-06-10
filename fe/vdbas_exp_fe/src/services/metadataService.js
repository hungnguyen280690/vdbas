import { get } from './api.js'

/**
 * MetadataService — provides attribute configuration for dynamic extended-attribute editors.
 *
 * Default implementation: returns an empty array for every scope.
 * Override `getAttributeMetadata` (or replace this service entirely) to supply
 * real config objects. Each config object has the shape:
 *
 *   {
 *     key:      string,         // attribute key stored in extAttributes
 *     label:    string,         // human-readable label shown in the editor
 *     type:     'input' | 'area' | 'select' | 'listbox' | 'radio' | 'checkbox' | 'date',
 *     multiple: boolean,        // for listbox / select only
 *     options:  { label, value }[],  // for select / listbox / radio
 *   }
 *
 * Example — fetch scope configs from the backend:
 *
 *   getAttributeMetadata: (scope) => get(`/attribute-metadata?scope=${scope}`)
 */
export const metadataService = {
  getAttributeMetadata: async (scope) => {
    // TODO: replace with a real API call or a populated config map.
    // Example: return get(`/attribute-metadata?scope=${scope}`)
    return []
  },
}
