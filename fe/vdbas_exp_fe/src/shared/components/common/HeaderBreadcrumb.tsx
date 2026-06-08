import { Breadcrumb } from 'antd'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '@/app/contexts/PermissionContext'
import { findPathInTree } from '@/shared/utils/treeUtils'

interface Props {
  currentPath: string
}

/**
 * Renders a breadcrumb trail based on the active path and the menu tree
 * returned by the permissions API.
 */
const HeaderBreadcrumb = ({ currentPath }: Props) => {
  const { t: translate } = useTranslation()
  const { menus } = usePermissions()

  if (!currentPath || currentPath === '/') {
    return <Breadcrumb items={[{ title: translate('menu.home') }]} />
  }

  const pathTrail = findPathInTree(menus, currentPath)

  if (!pathTrail.length) {
    return <Breadcrumb items={[{ title: translate('menu.home') }]} />
  }

  return (
    <Breadcrumb
      items={pathTrail.map((node: any) => ({ title: node.name }))}
    />
  )
}

export default HeaderBreadcrumb
