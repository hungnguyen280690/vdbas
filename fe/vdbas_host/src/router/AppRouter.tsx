import React, { Suspense, useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LoadingScreen } from '../layout/LoadingScreen'
import HomePage, { APPS } from '../pages/HomePage'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { registerRemotes, loadRemote } from '@module-federation/runtime'

// ── ErrorBoundary to catch loading failures of remote applications ─────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Failed to load remote app:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ── Dynamic Remote Loader Component ───────────────────────────────────────────
const RemoteAppLoader: React.FC<{ appCode: string; appUrl: string }> = ({ appCode, appUrl }) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const entry = appUrl.endsWith('/') ? `${appUrl}remoteEntry.js` : `${appUrl}/remoteEntry.js`
        // force: true ensures the API-supplied URL always overrides any stale registration
        registerRemotes(
          [{ name: appCode, entry, type: 'module' }],
          { force: true },
        )
        const module = await loadRemote(`${appCode}/App`) as { default: React.ComponentType<any> }
        if (active) {
          setComponent(() => module.default)
        }
      } catch (err: any) {
        console.error(`Failed to load dynamic remote app ${appCode}:`, err)
        if (active) {
          setError(err.message || `Error loading remote app ${appCode}`)
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [appCode, appUrl])

  if (error) {
    throw new Error(error)
  }

  if (!Component) {
    return <LoadingScreen message={`Đang tải ${appCode}...`} />
  }

  return <Component />
}

// ── Placeholder for apps not yet implemented ──────────────────────────────────
const ComingSoon: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: 400,
    gap: 16,
    color: 'var(--text-secondary)',
  }}>
    <div style={{ fontSize: 64 }}>🚧</div>
    <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
    <div style={{ fontSize: 14 }}>Ứng dụng này đang được phát triển, sẽ sớm ra mắt.</div>
  </div>
)

// ── Wrapper that provides height context and ErrorBoundary for remote apps ────
const RemoteFrame: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <ErrorBoundary
      fallback={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 400,
          gap: 16,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          padding: 32,
        }}>
          <div style={{ fontSize: 64 }}>🔌</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Không thể kết nối đến {label}</div>
          <div style={{ fontSize: 14, maxWidth: 450 }}>
            Ứng dụng có thể đang offline hoặc gặp sự cố khởi động trên container Docker.
          </div>
        </div>
      }
    >
      <Suspense fallback={<LoadingScreen message={`Đang tải ${label}...`} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  </div>
)

export const AppRouter: React.FC = () => {
  const { status, apps } = useAuth()

  if (status === 'loading') return <LoadingScreen message="Đang xác thực..." />
  if (status === 'unauthenticated') return <LoadingScreen message="Đang chuyển đến trang đăng nhập..." />

  // Lọc ra các apps từ API không nằm trong danh sách APPS mặc định để đăng ký route động hoàn toàn
  const registeredKeys = new Set(APPS.map((a) => a.key.toLowerCase()))
  const extraApps = apps?.filter((a) => !registeredKeys.has(a.appCode.toLowerCase())) || []

  return (
    <Routes>
      {/* Homepage — no sidebar, full-width */}
      <Route path="/" element={<HomePage />} />

      {/* Render routes for all statically defined apps with dynamic permission checks */}
      {APPS.map((app) => {
        const userApp = apps?.find((a) => a.appCode.toLowerCase() === app.key.toLowerCase())
        
        // Nếu app chưa available trong hệ thống (available = false), render ComingSoon
        if (!app.available) {
          return (
            <Route
              key={app.key}
              path={`/${app.key}/*`}
              element={<ComingSoon label={app.label} />}
            />
          )
        }

        return (
          <Route
            key={app.key}
            path={`/${app.key}/*`}
            element={
              userApp ? (
                <RemoteFrame label={app.label}>
                  <RemoteAppLoader appCode={userApp.appCode.toLowerCase()} appUrl={userApp.appUrl} />
                </RemoteFrame>
              ) : (
                <ForbiddenPage />
              )
            }
          />
        )
      })}

      {/* Render routes for any extra dynamic apps configured in the backend */}
      {extraApps.map((app) => (
        <Route
          key={app.appCode}
          path={`/${app.appCode.toLowerCase()}/*`}
          element={
            <RemoteFrame label={app.appCode}>
              <RemoteAppLoader appCode={app.appCode.toLowerCase()} appUrl={app.appUrl} />
            </RemoteFrame>
          }
        />
      ))}

      {/* Placeholder apps */}
      <Route path="/thu/*" element={<ComingSoon label="Thu" />} />
      <Route path="/chi/*" element={<ComingSoon label="Chi" />} />

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
