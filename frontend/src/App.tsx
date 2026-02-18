import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import MutuoForm from './components/MutuoForm'
import MutuoDetail from './components/MutuoDetail'
import ComparisonView from './components/ComparisonView'
import AdvisorChat from './components/AdvisorChat'
import PrintReport from './components/PrintReport'
import { api } from './api/client'
import type { Mutuo, MutuoForm as MutuoFormType, ViewMode, AdvisorStatus } from './types'

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [mutui, setMutui] = useState<Mutuo[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [detailId, setDetailId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [advisorStatus, setAdvisorStatus] = useState<AdvisorStatus | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [eurirs30y, setEurirs30y] = useState<number | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const loadMutui = useCallback(async () => {
    try {
      const data = await api.listaMutui()
      setMutui(data)
    } catch {
      // handled by empty state
    }
  }, [])

  const checkAdvisor = useCallback(async () => {
    try {
      const status = await api.statoAdvisor()
      setAdvisorStatus(status)
    } catch {
      setAdvisorStatus({ ollama_online: false, modello_disponibile: false, modello: 'gemma2:2b', modelli_installati: [] })
    }
  }, [])

  const loadEurirs = useCallback(async () => {
    try {
      const data = await api.getEurirs()
      setEurirs30y(data.eurirs_30y)
    } catch {
      // ignore
    }
  }, [])

  async function handleSaveEurirs(value: number) {
    try {
      await api.setEurirs(value)
      setEurirs30y(value)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nel salvataggio')
    }
  }

  async function handleExport() {
    try {
      const data = await api.esportaDati()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bancadvisor-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nell\'export')
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.mutui || !Array.isArray(data.mutui)) {
        alert('File non valido: deve contenere un array "mutui"')
        return
      }
      const result = await api.importaDati(data)
      alert(`Importati ${result.importati} mutui con successo!`)
      await loadMutui()
      await loadEurirs()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nell\'import')
    }
  }

  useEffect(() => {
    loadMutui()
    checkAdvisor()
    loadEurirs()
  }, [loadMutui, checkAdvisor, loadEurirs])

  async function handleCreateMutuo(data: MutuoFormType) {
    setFormLoading(true)
    try {
      await api.creaMutuo(data)
      await loadMutui()
      setView('dashboard')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nel salvataggio')
      throw e
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteMutuo(id: number) {
    if (!confirm('Eliminare questo mutuo?')) return
    try {
      await api.eliminaMutuo(id)
      setSelectedIds(prev => prev.filter(i => i !== id))
      await loadMutui()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nella cancellazione')
    }
  }

  async function handleToggleVerificato(id: number) {
    try {
      const result = await api.toggleVerificato(id)
      setMutui(prev => prev.map(m => m.id === id ? { ...m, verificato: result.verificato } : m))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nell\'aggiornamento')
    }
  }

  function handleToggleSelect(id: number) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleViewDetail(id: number) {
    setDetailId(id)
    setView('dettaglio')
  }

  function handleEditMutuo(id: number) {
    setEditId(id)
    setView('modifica')
  }

  async function handleUpdateMutuo(data: MutuoFormType) {
    if (!editId) return
    setFormLoading(true)
    try {
      await api.aggiornaMutuo(editId, data)
      await loadMutui()
      setEditId(null)
      setView('dashboard')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore nell\'aggiornamento')
      throw e
    } finally {
      setFormLoading(false)
    }
  }

  function handleNavigate(newView: ViewMode) {
    setView(newView)
    if (newView !== 'dettaglio') setDetailId(null)
    if (newView !== 'modifica') setEditId(null)
  }

  return (
    <div className="print-wrapper">
    <Layout currentView={view} onNavigate={handleNavigate} advisorStatus={advisorStatus}>
      {view === 'dashboard' && (
        <Dashboard
          mutui={mutui}
          onView={handleViewDetail}
          onEdit={handleEditMutuo}
          onDelete={handleDeleteMutuo}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleVerificato={handleToggleVerificato}
          onPrint={handlePrint}
          eurirs30y={eurirs30y}
          onSaveEurirs={handleSaveEurirs}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
      {view === 'nuovo' && (
        <MutuoForm onSubmit={handleCreateMutuo} loading={formLoading} />
      )}
      {view === 'modifica' && editId && (() => {
        const m = mutui.find(x => x.id === editId)
        if (!m) return null
        const formData: MutuoFormType = {
          banca: m.banca,
          tipo_tasso: m.tipo_tasso,
          tan: m.tan,
          taeg: m.taeg ?? undefined,
          spread: m.spread ?? undefined,
          importo: m.importo,
          valore_immobile: m.valore_immobile,
          durata_anni: m.durata_anni,
          spese_istruttoria: m.spese_istruttoria,
          spese_perizia: m.spese_perizia,
          costo_assicurazione: m.costo_assicurazione,
          spese_notarili: m.spese_notarili,
          altre_spese: m.altre_spese,
          note: m.note ?? '',
        }
        return <MutuoForm key={editId} onSubmit={handleUpdateMutuo} loading={formLoading} initialData={formData} editMode />
      })()}
      {view === 'confronto' && (
        <ComparisonView selectedIds={selectedIds} mutui={mutui} />
      )}
      {view === 'advisor' && (
        <AdvisorChat
          mutui={mutui}
          selectedIds={selectedIds}
          advisorStatus={advisorStatus}
        />
      )}
      {view === 'dettaglio' && detailId && (
        <MutuoDetail
          mutuoId={detailId}
          onBack={() => handleNavigate('dashboard')}
          onEdit={handleEditMutuo}
        />
      )}
    </Layout>
    <PrintReport ref={printRef} mutui={mutui} />
    </div>
  )
}
