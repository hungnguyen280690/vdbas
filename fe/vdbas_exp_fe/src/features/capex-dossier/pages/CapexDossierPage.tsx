import { useState } from 'react'
import CapexDossierListPage from './CapexDossierListPage'
import CapexDossierDetailPage from './CapexDossierDetailPage'

type View = 'list' | 'detail'
type Mode = 'new' | 'view' | 'edit'

const CapexDossierPage = () => {
  const [view,      setView]      = useState<View>('list')
  const [recordId,  setRecordId]  = useState<string | null>(null)
  const [mode,      setMode]      = useState<Mode>('view')

  const handleNavigate = (id: string | null, m: Mode) => {
    setRecordId(id)
    setMode(m)
    setView('detail')
  }

  const handleBack = () => {
    setView('list')
    setRecordId(null)
  }

  const handleEdit = (id: string) => {
    setRecordId(id)
    setMode('edit')
  }

  if (view === 'detail') {
    return (
      <CapexDossierDetailPage
        recordId={recordId}
        mode={mode}
        onBack={handleBack}
        onEdit={handleEdit}
      />
    )
  }

  return <CapexDossierListPage onNavigate={handleNavigate} />
}

export default CapexDossierPage
