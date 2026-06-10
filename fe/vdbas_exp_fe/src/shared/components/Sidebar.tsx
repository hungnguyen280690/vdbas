import { useState, useEffect } from 'react'
import { Menu, type MenuProps } from 'antd'
import { useTranslation } from 'react-i18next'
import { AppstoreOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { usePermissions } from '../contexts/PermissionContext'
import type { MenuItem as MenuItemData } from '@/types/index'

type AntMenuItem = Required<MenuProps>['items'][number]

const COLLAPSED_W = 64
const EXPANDED_W  = 250
const iconMap: Record<string, React.ReactNode> = {}

interface SidebarProps {
  collapsed: boolean
  onCollapse: () => void
  currentPath: string
  onMenuClick: (path: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse, currentPath, onMenuClick }) => {
  const { menus, isLoading } = usePermissions()
  const { t: translate }     = useTranslation()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const buildMenuItems = (list: MenuItemData[]): AntMenuItem[] => {
    if (!list?.length) return []
    return list.map((menu): AntMenuItem => {
      const base = {
        key:   (menu.path ?? menu.code) as string,
        icon:  iconMap[menu.code as string] ?? <AppstoreOutlined />,
        label: menu.name as string,
      }
      if (menu.children?.length) return { ...base, children: buildMenuItems(menu.children) }
      if (menu.path)             return { ...base, onClick: () => onMenuClick(menu.path as string) }
      return base
    })
  }

  const menuItems = buildMenuItems(menus)

  const getSelectedKeys = (): string[] => {
    const find = (items: AntMenuItem[]): string[] => {
      for (const item of items) {
        if (!item || !('key' in item)) continue
        if (item.key === currentPath) return [String(item.key)]
        if ('children' in item && item.children) {
          const found = find(item.children as AntMenuItem[])
          if (found.length) return found
        }
      }
      return []
    }
    return currentPath ? find(menuItems) : []
  }

  useEffect(() => {
    if (!currentPath || !menuItems.length) return
    const findOpen = (items: AntMenuItem[], parentKey: string | null = null): boolean => {
      for (const item of items) {
        if (!item || !('key' in item)) continue
        const key = String(item.key)
        if (key === currentPath && parentKey) {
          setOpenKeys((prev) => prev.includes(parentKey) ? prev : [...prev, parentKey])
          return true
        }
        if ('children' in item && item.children) {
          if (findOpen(item.children as AntMenuItem[], key)) {
            if (parentKey) setOpenKeys((prev) => prev.includes(parentKey) ? prev : [...prev, parentKey])
            return true
          }
        }
      }
      return false
    }
    findOpen(menuItems)
  }, [currentPath, menuItems])

  const w = collapsed ? COLLAPSED_W : EXPANDED_W

  return (
    <div
      className="vdbas-sidebar"
      style={{ width: w, minWidth: w, height: '100%', display: 'flex', flexDirection: 'column', transition: 'width 0.2s, min-width 0.2s', overflow: 'hidden', flexShrink: 0, borderRight: '1px solid #D9D9D9' }}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '24px 16px', color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center' }}>
            {translate('common.loading_menu')}
          </div>
        ) : (
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={getSelectedKeys()}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            items={menuItems}
            className="vdbas-sidebar-menu"
            style={{ border: 0 }}
          />
        )}
      </div>
      <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #e8e8e8' }}>
        <button
          onClick={onCollapse}
          title={collapsed ? translate('common.expand') : translate('common.collapse')}
          style={{ background: 'transparent', border: 0, color: '#6A6D70', cursor: 'pointer', padding: '6px 10px', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', transition: 'color 0.2s, background 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0A6ED1'; e.currentTarget.style.background = '#E8F3FF' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6A6D70'; e.currentTarget.style.background = 'transparent' }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
