import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Dropdown } from 'antd'
import {
  BellOutlined,
  DownOutlined,
  HomeOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAuth } from '../auth/AuthProvider'
import type { MenuProps } from 'antd'

const APP_LABELS: Record<string, string> = {
  qtdc: 'Quản lý Tra cứu Danh mục',
  template: 'Ứng dụng Mẫu',
  hrm: 'Nhân sự (HRM)',
  crm: 'Khách hàng (CRM)',
  finance: 'Tài chính',
  reports: 'Báo cáo & Thống kê',
}

/* Exact values from VDBAS_HOME.html */
const PRIMARY      = '#0b5394'
const PRIMARY_DARK = '#073763'
const HDR_BG       = `linear-gradient(90deg, ${PRIMARY_DARK}, ${PRIMARY})`

const tbtn: React.CSSProperties = {
  width: 30, height: 30,
  borderRadius: '50%',
  background: 'rgba(255,255,255,.12)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff',
  border: 0,
  cursor: 'pointer',
  position: 'relative',
  flexShrink: 0,
}

export const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()

  const appKey   = location.pathname.split('/').filter(Boolean)[0]
  const appLabel = appKey ? APP_LABELS[appKey] : null

  const displayName =
    (user?.name as string) ||
    (user?.preferred_username as string) ||
    (user?.email as string) ||
    'User'
  const initials = displayName.charAt(0).toUpperCase()
  const userRole =
    user?.realm_access?.roles?.find(r => r !== 'default-roles-master' && r !== 'offline_access' && r !== 'uma_authorization') ||
    (user?.preferred_username as string) ||
    ''

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 160 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
          {user?.email && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {user.email as string}
            </div>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: logout,
    },
  ]

  return (
    <header style={{
      background: HDR_BG,
      color: '#fff',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,.12)',
      flexShrink: 0,
      zIndex: 100,
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>

      {/* Logo + brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: '#fff', color: PRIMARY_DARK,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 11, letterSpacing: '.3px',
          flexShrink: 0,
        }}>
          VDBAS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', color: '#fff' }}>
          <span style={{ fontSize: 11, opacity: .8, letterSpacing: '.4px', textTransform: 'uppercase' }}>
            VDBAS_HOME
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '.2px' }}>
            Hệ thống quản lý kế toán ngân sách nhà nước số
          </span>
        </div>
      </Link>

      {/* Active app breadcrumb */}
      {appLabel && (
        <>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 20, fontWeight: 300 }}>|</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 500 }}>
            {appLabel}
          </span>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 0, color: 'rgba(255,255,255,.75)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <HomeOutlined style={{ fontSize: 13 }} /> Trang chủ
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Action buttons — search, notifications, help */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          style={tbtn}
          title="Tìm kiếm toàn hệ thống"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          <SearchOutlined style={{ fontSize: 16 }} />
        </button>

        <button
          style={tbtn}
          title="Thông báo"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          <BellOutlined style={{ fontSize: 16 }} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#f44336',
            border: `1.5px solid ${PRIMARY_DARK}`,
          }} />
        </button>

        <button
          style={tbtn}
          title="Trợ giúp"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          <QuestionCircleOutlined style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* User pill */}
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
            background: 'rgba(255,255,255,.12)', padding: '5px 12px 5px 5px', borderRadius: 24,
            cursor: 'pointer', userSelect: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#fff', color: PRIMARY_DARK,
            fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, fontSize: 12.5 }}>{displayName}</span>            
          </div>
          <DownOutlined style={{ fontSize: 12, marginLeft: 2, opacity: .85 }} />
        </div>
      </Dropdown>
    </header>
  )
}
