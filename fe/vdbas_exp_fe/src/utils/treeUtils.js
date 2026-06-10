/**
 * Utility functions for tree data structures.
 */

/**
 * Converts a flat list into a tree using `idKey` / `parentKey` relationships.
 * Empty `children` arrays are removed so Ant Design Table renders correctly.
 */
export const listToTree = (list, idKey = 'id', parentKey = 'parentId') => {
  const map = {}
  const roots = []

  list.forEach((item) => {
    map[item[idKey]] = { ...item, children: [] }
  })

  list.forEach((item) => {
    const parentId = item[parentKey]
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[item[idKey]])
    } else {
      roots.push(map[item[idKey]])
    }
  })

  const cleanTree = (nodes) => {
    nodes.forEach((node) => {
      if (node.children.length === 0) {
        delete node.children
      } else {
        cleanTree(node.children)
      }
    })
  }

  cleanTree(roots)
  return roots
}

/**
 * Builds a category tree from a flat list.
 * Items whose `parentId` is null/undefined/'NULL'/'' become root nodes.
 */
export const buildCategoryTree = (items, parentId = null) => {
  if (!items || !Array.isArray(items)) return []
  return items
    .filter((item) => {
      const pId = item.parentId
      return pId === parentId || (parentId === null && (!pId || pId === 'NULL' || pId === ''))
    })
    .map((item) => ({
      ...item,
      children: buildCategoryTree(items, item.id),
    }))
}

/**
 * Filters a tree, keeping nodes that satisfy `predicate` and their ancestors.
 */
export const filterTree = (tree, predicate) => {
  return tree
    .map((node) => ({ ...node }))
    .filter(function filter(node) {
      if (predicate(node)) return true
      if (node.children) {
        node.children = node.children.filter(filter)
        return node.children.length > 0
      }
      return false
    })
}

/**
 * Returns the trail of nodes from the root to the node whose `path` matches `targetPath`.
 */
export const findPathInTree = (tree, targetPath) => {
  if (!tree || !targetPath) return []

  for (const node of tree) {
    if (node.path === targetPath) return [node]
    if (node.children?.length) {
      const childPath = findPathInTree(node.children, targetPath)
      if (childPath.length) return [node, ...childPath]
    }
  }

  return []
}
