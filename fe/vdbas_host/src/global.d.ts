// ── Vite env type augmentation ────────────────────────────────────────────────
interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_KEYCLOAK_REALM: string
  readonly VITE_KEYCLOAK_CLIENT_ID: string
  readonly VITE_API_BASE_URL: string
  // Legacy static remote URLs — kept for .env compatibility, URLs now come from /api/me/apps
  readonly VITE_QTDC_REMOTE_URL: string
  readonly VITE_TEMPLATE_REMOTE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ── Static asset shims ────────────────────────────────────────────────────────
declare module '*.css' {
  const styles: Record<string, string>
  export default styles
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}
