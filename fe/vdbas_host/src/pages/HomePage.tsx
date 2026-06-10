import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Row, Tag, Typography } from 'antd'
import { useAuth } from '../auth/AuthProvider'

const { Text } = Typography

export interface AppDefinition {
  key: string
  label: string
  description: string
  icon: string
  color: string
  available: boolean
}

export const APPS: AppDefinition[] = [
  {
    key: 'qtdc',
    label: 'Quản lý Người dùng Danh mục',
    description: 'Quản lý danh mục, phân quyền, hồ sơ nhân sự và tổ chức',
    icon: '📚',
    color: '#4f46e5',
    available: true,
  },
  {
    key: 'template',
    label: 'Ứng dụng Mẫu',
    description: 'Template chuẩn dùng để khởi tạo các ứng dụng mới trong hệ thống',
    icon: '📋',
    color: '#0ea5e9',
    available: true,
  },
  {
    key: 'so_cai',
    label: 'Quản lý Sổ cái',
    description: 'Quản lý sổ cái, hóa đơn và báo cáo tài chính',
    icon: '📚',
    color: '#10b981',
    available: false,
  },
  {
    key: 'thu_tt',
    label: 'Quản lý Thu và Thanh toán Ngân sách', 
    description: 'Quản lý thu ngân sách, hóa đơn và báo cáo tài chính',
    icon: '🤝',
    color: '#f59e0b',
    available: false,
  },
  {
    key: 'dich_vu',
    label: 'Quản lý Dich vụ Kho bạc Nhà nước',
    description: 'Quản lý Dịch vụ Kho bạc Nhà nước, cổng nghiệp vụ, cổng dịch vụ công',
    icon: '🛎️',
    color: '#ef4444',
    available: false,
  },
  {
    key: 'kho_dl',
    label: 'Quản lý Kho dữ liệu',
    description: 'Quản lý kho dữ liệu, lưu trữ và truy xuất thông tin',
    icon: '📚',
    color: '#8b5cf6',
    available: false,
  },
  {
    key: 'luu_tru',
    label: 'Quản lý Lưu trữ Điện tử',
    description: 'Quản lý lưu trữ điện tử',
    icon: '🗄️',
    color: '#ef4444',
    available: false,
  },
  {
    key: 'kiem_tra',
    label: 'Kiểm tra giám sát',
    description: 'Hệ thống kiểm tra giám sát, cảnh báo và phản hồi thông tin',
    icon: '📊',
    color: '#8b5cf6',
    available: false,
  },
  {
    key: 'exp',
    label: 'Quản lý chi',
    description: 'Phân hệ quản lý chi',
    icon: '📋',
    color: '#0ea5e9',
    available: true,
  },
]

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, apps } = useAuth()
  const displayName =
    (user?.name as string) ||
    (user?.preferred_username as string) ||
    'bạn'

  // Kiểm tra xem user có được quyền truy cập ứng dụng không
  const isAppAvailable = (app: AppDefinition) => {
    if (!app.available) return false
    if (!apps) return false
    return apps.some((a) => a.appCode.toLowerCase() === app.key.toLowerCase())
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)',
      padding: '28px 32px 40px',
    }}>

      {/* ── Welcome banner — matches VDBAS_HOME.html zone 02 ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #d7dbe0',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(15,20,25,.04)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        minHeight: 360,
        marginBottom: 28,
      }}>

        {/* Left – content */}
        <div style={{
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 16,
        }}>
          <span style={{
            fontSize: 11.5, fontWeight: 600,
            color: '#0b5394',
            textTransform: 'uppercase', letterSpacing: '.8px',
          }}>
            VDBAS_HOME.2 · Chào mừng
          </span>

          <div style={{ fontSize: 24, fontWeight: 700, color: '#073763', lineHeight: 1.25 }}>
            Chào mừng {displayName} đến với VDBAS<br />
            Hệ thống quản lý kế toán ngân sách nhà nước số
          </div>

          <p style={{ fontSize: 13.5, color: '#3a3f45', lineHeight: 1.55, margin: 0, maxWidth: 520 }}>
            Nền tảng tập trung quản lý, điều hành nghiệp vụ kế toán ngân sách nhà nước của Kho bạc Nhà nước.
            Vui lòng lựa chọn ứng dụng bên dưới để bắt đầu công việc hoặc tham khảo tài liệu hướng dẫn sử dụng.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 16px',
              background: '#0b5394', color: '#fff',
              border: '1px solid #0b5394', borderRadius: 4,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}>
              Bắt đầu sử dụng
            </button>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 16px',
              background: '#fff', color: '#0b5394',
              border: '1px solid #c6d6e6', borderRadius: 4,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}>
              Tài liệu hướng dẫn
            </button>
          </div>
        </div>

        {/* Right – hero panel (#0b1f3a, exact from prototype) */}
        <div style={{
          background: '#0b1f3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 280,
        }}>
          {/* Simulates ::after overlay from prototype */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(11,83,148,.25) 0%, rgba(11,83,148,0) 25%)',
            pointerEvents: 'none',
          }} />

          <img
            src="/hero-vdbas.jpg"
            alt="Minh hoạ hệ thống VDBAS - trung tâm điều hành số"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}
          />

        </div>
      </div>

      {/* App grid — 6 cards */}
      <Row gutter={[24, 24]}>
        {APPS.map((app) => {
          const permitted = isAppAvailable(app)
          return (
            <Col key={app.key} xs={24} sm={12} xl={8}>
              <Card
                hoverable={permitted}
                onClick={() => permitted && navigate(`/${app.key}`)}
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  cursor: permitted ? 'pointer' : 'default',
                  opacity: permitted ? 1 : 0.6,
                  transition: 'all 200ms ease',
                  height: '100%',
                }}
                styles={{ body: { padding: 24 } }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Icon row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 52, height: 52,
                      borderRadius: 14,
                      background: `${app.color}1a`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      flexShrink: 0,
                    }}>
                      {app.icon}
                    </div>
                    {!app.available ? (
                      <Tag color="default" style={{ borderRadius: 20, fontSize: 11, margin: 0 }}>
                        Sắp ra mắt
                      </Tag>
                    ) : !permitted ? (
                      <Tag color="error" style={{ borderRadius: 20, fontSize: 11, margin: 0 }}>
                        Không có quyền
                      </Tag>
                    ) : null}
                  </div>

                  {/* Label + description */}
                  <div>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 5,
                      lineHeight: 1.35,
                    }}>
                      {app.label}
                    </div>
                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.55 }}>
                      {app.description}
                    </Text>
                  </div>

                  {/* Color accent line */}
                  <div style={{
                    height: 3,
                    borderRadius: 2,
                    background: permitted ? app.color : 'var(--border)',
                    marginTop: 2,
                  }} />
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}

export default HomePage
