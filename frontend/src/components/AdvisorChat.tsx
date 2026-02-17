import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import type { Mutuo, AdvisorStatus, Consulenza } from '../types'
import { Bot, Send, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import Markdown from './Markdown'

interface Props {
  mutui: Mutuo[]
  selectedIds: number[]
  advisorStatus: AdvisorStatus | null
}

export default function AdvisorChat({ mutui, selectedIds, advisorStatus }: Props) {
  const [domanda, setDomanda] = useState('')
  const [risposta, setRisposta] = useState('')
  const [loading, setLoading] = useState(false)
  const [storico, setStorico] = useState<Consulenza[]>([])
  const [mutuoIds, setMutuoIds] = useState<number[]>(selectedIds.length > 0 ? selectedIds : mutui.map(m => m.id))
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStorico()
  }, [])

  useEffect(() => {
    if (selectedIds.length > 0) {
      setMutuoIds(selectedIds)
    }
  }, [selectedIds])

  async function loadStorico() {
    try {
      const s = await api.storicoConsulenze()
      setStorico(s)
    } catch {
      // ignore
    }
  }

  async function chiediConsulenza() {
    if (mutuoIds.length === 0) return
    setLoading(true)
    setRisposta('')
    try {
      const res = await api.chiediConsulenza(mutuoIds, domanda || undefined)
      setRisposta(res.risposta)
      setDomanda('')
      loadStorico()
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      setRisposta(e instanceof Error ? e.message : 'Errore nella consulenza')
    }
    setLoading(false)
  }

  const isOnline = advisorStatus?.ollama_online && advisorStatus?.modello_disponibile

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={`card p-4 flex items-center gap-3 ${isOnline ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
        {isOnline ? (
          <>
            <CheckCircle2 size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Gemma 2B \u00e8 pronta</p>
              <p className="text-xs text-green-600">Il consulente AI \u00e8 disponibile per analizzare i tuoi mutui</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle size={20} className="text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Ollama non raggiungibile</p>
              <p className="text-xs text-red-600">
                Avvia Ollama con: <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">ollama serve</code> e poi{' '}
                <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">ollama pull gemma2:2b</code>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Mutui Selection */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Mutui da Analizzare
        </h3>
        {mutui.length === 0 ? (
          <p className="text-sm text-gray-500">Nessun mutuo inserito. Aggiungi prima delle offerte.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mutui.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setMutuoIds(prev =>
                    prev.includes(m.id)
                      ? prev.filter(id => id !== m.id)
                      : [...prev, m.id]
                  )
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mutuoIds.includes(m.id)
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {m.banca}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Chiedi al Consulente
        </h3>
        <div className="space-y-3">
          <textarea
            value={domanda}
            onChange={e => setDomanda(e.target.value)}
            placeholder="Scrivi una domanda specifica o lascia vuoto per un'analisi generale... (es. 'Quale mutuo mi conviene di pi\u00f9 considerando che ho un reddito variabile?')"
            className="input-field h-24 resize-none"
          />
          <button
            onClick={chiediConsulenza}
            disabled={loading || mutuoIds.length === 0 || !isOnline}
            className="btn-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gemma sta analizzando...
              </>
            ) : (
              <>
                <Send size={16} />
                Chiedi Consulenza
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response */}
      {risposta && (
        <div ref={responseRef} className="card p-6 border-accent-200 bg-accent-50/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-accent-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent-800">Consulenza Gemma 2B</p>
              <p className="text-[10px] text-accent-600 uppercase tracking-wider">Analisi AI</p>
            </div>
          </div>
          <div className="max-w-none">
            <Markdown content={risposta} />
          </div>
        </div>
      )}

      {/* History */}
      {storico.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Consulenze Precedenti
            </h3>
          </div>
          {storico.slice(0, 10).map(c => {
            const isExpanded = expandedId === c.id
            return (
              <div
                key={c.id}
                className="card p-5 cursor-pointer hover:border-primary-200 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(c.created_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {c.mutuo_ids.length} mutui analizzati
                    </span>
                    {isExpanded
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </div>
                </div>
                {c.domanda && (
                  <p className="text-sm text-gray-600 mb-2 italic">"  {c.domanda}"</p>
                )}
                {isExpanded ? (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Markdown content={c.risposta} />
                  </div>
                ) : (
                  <div className="line-clamp-3 overflow-hidden text-sm text-gray-500">
                    {c.risposta.slice(0, 200)}...
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
