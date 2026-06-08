import { useState, useEffect, ReactNode } from 'react'
import { Menu } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { usePermissions } from '@/app/contexts/PermissionContext'
import { MenuItem } from '@/shared/types'

const COLLAPSED_W = 64
const EXPANDED_W  = 250

const iconMap: Record<string, ReactNode> = {
  // '01': <SomeIcon />,
}

interface SidebarProps {
  collapsed: boolean
  onCollapse: () => void
  currentPath: string
  onMenuClick: (path: string) => void
}

const Sidebar = ({ collapsed, onCollapse, currentPath, onMenuClick }: SidebarProps) => {
  const { menus, isLoading } = usePermissions()
  const { t: translate }     = useTranslation()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const buildMenuItems = (menuList: MenuItem[]): any[] => {
    if (!menuList?.length) return []
    return menuList.map((menu) => {
      const item: any = {
        key:   menu.path || menu.code,
        icon:  iconMap[menu.code] || <AppstoreOutlined />,
        label: menu.name,
      }
      if (menu.children?.length) {
        item.children = buildMenuItems(menu.children)
      } else if (menu.path) {
        item.onClick = () => onMenuClick?.(menu.path as string)
      }
      return item
    })
  }

  const menuItems = buildMenuItems(menus)

  const getSelectedKeys = () => {
    if (!currentPath) return []
    const find = (items: any[]): string[] => {
      for (const item of items) {
        if (item.key === currentPath) return [item.key]
        if (item.children) {
          const found = find(item.children)
          if (found.length) return found
        }
      }
      return []
    }
    return find(menuItems)
  }

  useEffect(() => {
    if (!currentPath || !menuItems.length) return
    const findOpen = (items: any[], parentKey: string | null = null): boolean => {
      for (const item of items) {
        if (item.key === currentPath && parentKey) {
          setOpenKeys((prev) => prev.includes(parentKey) ? prev : [...prev, parentKey])
          return true
        }
        if (item.children && findOpen(item.children, item.key)) {
          if (parentKey) setOpenKeys((prev) => prev.includes(parentKey) ? prev : [...prev, parentKey])
          return true
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
      style={{
        width: w,
        minWidth: w,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s, min-width 0.2s',
        overflow: 'hidden',
        flexShrink: 0,
        borderRight: '1px solid #D9D9D9',
      }}
    >
      {/* Menu */}
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
            onOpenChange={(keys) => setOpenKeys(keys)}
            items={menuItems}
            className="vdbas-sidebar-menu"
            style={{ border: 0 }}
          />
        )}
      </div>

      {/* Collapse toggle */}
      <div style={{
        height: 40,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '1px solid #e8e8e8',
      }}>
        <button
          onClick={onCollapse}
          title={collapsed ? translate('common.expand') : translate('common.collapse')}
          style={{
            background: 'transparent',
            border: 0,
            color: '#6A6D70',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            transition: 'color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0A6ED1'; e.currentTarget.style.background = '#E8F3FF' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6A6D70'; e.currentTarget.style.background = 'transparent' }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
