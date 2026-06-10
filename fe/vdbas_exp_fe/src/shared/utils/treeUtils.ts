import type { TreeNode } from '@/shared/types/index'

export const listToTree = (
  list: TreeNode[],
  idKey = 'id',
  parentKey = 'parentId',
): TreeNode[] => {
  const map: Record<string | number, TreeNode> = {}
  const roots: TreeNode[] = []

  list.forEach((item) => {
    const id = item[idKey] as string | number
    map[id] = { ...item, children: [] }
  })

  list.forEach((item) => {
    const parentId = item[parentKey] as string | number | null | undefined
    const id = item[idKey] as string | number
    if (parentId && map[parentId]) {
      map[parentId].children!.push(map[id])
    } else {
      roots.push(map[id])
    }
  })

  const cleanTree = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      if (!node.children?.length) {
        delete node.children
      } else {
        cleanTree(node.children)
      }
    })
  }

  cleanTree(roots)
  return roots
}

export const buildCategoryTree = (
  items: TreeNode[],
  parentId: string | number | null = null,
): TreeNode[] => {
  if (!items || !Array.isArray(items)) return []
  return items
    .filter((item) => {
      const pId = item.parentId as string | number | null | undefined
      return pId === parentId || (parentId === null && (!pId || pId === 'NULL' || pId === ''))
    })
    .map((item) => ({
      ...item,
      children: buildCategoryTree(items, item.id as string | number),
    }))
}

export const filterTree = (
  tree: TreeNode[],
  predicate: (node: TreeNode) => boolean,
): TreeNode[] => {
  return tree
    .map((node) => ({ ...node }))
    .filter(function filter(node: TreeNode): boolean {
      if (predicate(node)) return true
      if (node.children) {
        node.children = node.children.filter(filter)
        return node.children.length > 0
      }
      return false
    })
}

export const findPathInTree = (
  tree: TreeNode[],
  targetPath: string,
): TreeNode[] => {
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
