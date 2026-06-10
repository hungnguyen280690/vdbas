import { Breadcrumb } from 'antd'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '../../contexts/PermissionContext'
import { findPathInTree } from '../../utils/treeUtils'

const HeaderBreadcrumb: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const { t: translate } = useTranslation()
  const { menus } = usePermissions()

  if (!currentPath || currentPath === '/') {
    return <Breadcrumb items={[{ title: translate('menu.home') }]} />
  }

  const pathTrail = findPathInTree(menus, currentPath)
  if (!pathTrail.length) return <Breadcrumb items={[{ title: translate('menu.home') }]} />

  return <Breadcrumb items={pathTrail.map((node) => ({ title: node.name as string }))} />
}

export default HeaderBreadcrumb
