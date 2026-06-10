import { Breadcrumb } from 'antd'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '../../contexts/PermissionContext.jsx'
import { findPathInTree } from '../../utils/treeUtils.js'

/**
 * Renders a breadcrumb trail based on the active path and the menu tree
 * returned by the permissions API.
 */
const HeaderBreadcrumb = ({ currentPath }) => {
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
      items={pathTrail.map((node) => ({ title: node.name }))}
    />
  )
}

export default HeaderBreadcrumb
