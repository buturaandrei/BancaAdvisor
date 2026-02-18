import { useState } from 'react'
import type { MutuoForm as MutuoFormType } from '../types'
import { Save, RotateCcw, ClipboardPaste, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { parseMutuoText } from '../utils/parser'

interface Props {
  onSubmit: (data: MutuoFormType) => Promise<void>
  loading: boolean
  initialData?: MutuoFormType
  editMode?: boolean
}

const defaultForm: MutuoFormType = {
  banca: '',
  tipo_tasso: 'fisso',
  tan: 0,
  taeg: undefined,
  spread: undefined,
  importo: 0,
  valore_immobile: 0,
  durata_anni: 25,
  spese_istruttoria: 0,
  spese_perizia: 0,
  costo_assicurazione: 0,
  spese_notarili: 0,
  altre_spese: 0,
  note: '',
}

export default function MutuoForm({ onSubmit, loading, initialData, editMode }: Props) {
  const [form, setForm] = useState<MutuoFormType>(initialData ? { ...initialData } : { ...defaultForm })
  const [importOpen, setImportOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [parseResult, setParseResult] = useState<{ campiTrovati: string[]; noteParts: string[] } | null>(null)

  const set = (field: keyof MutuoFormType, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleParse = () => {
    if (!pasteText.trim()) return
    const { form: parsed, campiTrovati, noteParts } = parseMutuoText(pasteText)
    setParseResult({ campiTrovati, noteParts })

    // Merge solo i campi trovati nel form esistente
    setForm(prev => {
      const updated = { ...prev }
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== undefined && value !== 0) {
          ;(updated as Record<string, unknown>)[key] = value
        }
      }
      // Aggiungi note estratte
      if (noteParts.length > 0) {
        const noteText = noteParts.join('\n').trim()
        updated.note = prev.note ? `${prev.note}\n\n${noteText}` : noteText
      }
      return updated
    })
  }

  const handleClearImport = () => {
    setPasteText('')
    setParseResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(form)
      setForm({ ...defaultForm })
      setPasteText('')
      setParseResult(null)
      setImportOpen(false)
    } catch {
      // errore gestito nel parent, non resettare il form
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Smart Import */}
      <div className="card p-6">
        <button
          type="button"
          onClick={() => setImportOpen(!importOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <ClipboardPaste size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Importa da Testo
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Incolla il testo copiato dal sito della banca
              </p>
            </div>
          </div>
          {importOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {importOpen && (
          <div className="mt-5 space-y-4">
            <textarea
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); setParseResult(null) }}
              className="input-field h-40 resize-y font-mono text-xs"
              placeholder={"Incolla qui il testo copiato da un sito di mutui...\n\nEsempio:\nImporto Mutuo: \u20ac 180.000\nDurata: 30 anni\nTasso Fisso: 3,50%\nTAEG: 3,66%\nIstruttoria: \u20ac 600,00\nPerizia: \u20ac 350,00\n..."}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleParse}
                disabled={!pasteText.trim()}
                className="btn-primary flex items-center gap-2 text-sm !py-2"
              >
                <ClipboardPaste size={16} />
                Analizza Testo
              </button>
              {pasteText && (
                <button
                  type="button"
                  onClick={handleClearImport}
                  className="btn-secondary flex items-center gap-2 text-sm !py-2"
                >
                  <X size={16} />
                  Pulisci
                </button>
              )}
            </div>

            {parseResult && (
              <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-4">
                <h3 className="text-sm font-medium text-violet-800 mb-2 flex items-center gap-1.5">
                  <Check size={16} className="text-green-600" />
                  {parseResult.campiTrovati.length} campi trovati e compilati
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parseResult.campiTrovati.map((c, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-violet-700 border border-violet-200">
                      {c}
                    </span>
                  ))}
                </div>
                {parseResult.campiTrovati.length > 0 && (
                  <p className="text-xs text-gray-500 mt-3">
                    \u26a0\ufe0f Controlla i valori nel form e aggiungi il <strong>Nome Banca</strong> e il <strong>Valore Immobile</strong> manualmente.
                  </p>
                )}
                {parseResult.campiTrovati.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Nessun campo riconosciuto. Prova a incollare più testo dalla pagina del mutuo.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-5">
          Dati Principali
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="label">Nome Banca *</label>
            <input
              type="text"
              required
              value={form.banca}
              onChange={e => set('banca', e.target.value)}
              className="input-field"
              placeholder="es. Intesa Sanpaolo"
            />
          </div>
          <div>
            <label className="label">Tipo Tasso *</label>
            <select
              value={form.tipo_tasso}
              onChange={e => set('tipo_tasso', e.target.value)}
              className="input-field"
            >
              <option value="fisso">Fisso</option>
              <option value="variabile">Variabile</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          <div>
            <label className="label">TAN (%) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              max="100"
              value={form.tan || ''}
              onChange={e => set('tan', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 2.85"
            />
          </div>
          <div>
            <label className="label">TAEG (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.taeg ?? ''}
              onChange={e => set('taeg', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 3.10"
            />
          </div>
          <div>
            <label className="label">Spread (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.spread ?? ''}
              onChange={e => set('spread', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 1.20"
            />
          </div>
          <div>
            <label className="label">Durata (anni) *</label>
            <input
              type="number"
              required
              min="1"
              max="40"
              value={form.durata_anni || ''}
              onChange={e => set('durata_anni', parseInt(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 25"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-5">
          Importi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Importo Mutuo (\u20ac) *</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={form.importo || ''}
              onChange={e => set('importo', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 200000"
            />
          </div>
          <div>
            <label className="label">Valore Immobile (\u20ac) *</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={form.valore_immobile || ''}
              onChange={e => set('valore_immobile', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 250000"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-5">
          Spese Accessorie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="label">Spese Istruttoria (\u20ac)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={form.spese_istruttoria || ''}
              onChange={e => set('spese_istruttoria', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 800"
            />
          </div>
          <div>
            <label className="label">Spese Perizia (\u20ac)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={form.spese_perizia || ''}
              onChange={e => set('spese_perizia', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 300"
            />
          </div>
          <div>
            <label className="label">Assicurazione (\u20ac)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={form.costo_assicurazione || ''}
              onChange={e => set('costo_assicurazione', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 2000"
            />
          </div>
          <div>
            <label className="label">Spese Notarili (\u20ac)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={form.spese_notarili || ''}
              onChange={e => set('spese_notarili', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 3000"
            />
          </div>
          <div>
            <label className="label">Altre Spese (\u20ac)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={form.altre_spese || ''}
              onChange={e => set('altre_spese', parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="es. 500"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-5">
          Note
        </h2>
        <textarea
          value={form.note || ''}
          onChange={e => set('note', e.target.value)}
          className="input-field h-24 resize-none"
          placeholder="Eventuali note, condizioni particolari, clausole..."
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          <Save size={18} />
          {loading ? 'Salvataggio...' : editMode ? 'Aggiorna Mutuo' : 'Salva Mutuo'}
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...defaultForm })}
          className="btn-secondary flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </form>
  )
}
