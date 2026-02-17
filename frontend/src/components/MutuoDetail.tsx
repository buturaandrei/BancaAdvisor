import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { Mutuo, AmortizationRow } from '../types'
import { formatCurrency, formatPercent, tipoTassoLabel, tipoTassoBadgeClass, punteggioColor, punteggioBgColor } from '../utils/format'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

interface Props {
  mutuoId: number
  onBack: () => void
}

export default function MutuoDetail({ mutuoId, onBack }: Props) {
  const [mutuo, setMutuo] = useState<Mutuo | null>(null)
  const [piano, setPiano] = useState<AmortizationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [mutuoId])

  async function loadData() {
    setLoading(true)
    try {
      const [m, p] = await Promise.all([
        api.dettaglioMutuo(mutuoId),
        api.pianoAmmortamento(mutuoId),
      ])
      setMutuo(m)
      setPiano(p.piano)
    } catch {
      // handled by empty state
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse-soft text-gray-400">Caricamento...</div>
      </div>
    )
  }

  if (!mutuo) {
    return <div className="text-center py-20 text-gray-500">Mutuo non trovato</div>
  }

  // Prepare chart data - yearly summary
  const yearlyData: { anno: number; capitale: number; interessi: number; residuo: number }[] = []
  for (let i = 0; i < piano.length; i += 12) {
    const yearSlice = piano.slice(i, i + 12)
    const anno = Math.floor(i / 12) + 1
    yearlyData.push({
      anno,
      capitale: yearSlice.reduce((s, r) => s + r.quota_capitale, 0),
      interessi: yearSlice.reduce((s, r) => s + r.quota_interessi, 0),
      residuo: yearSlice[yearSlice.length - 1]?.debito_residuo ?? 0,
    })
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft size={16} />
        Torna alla lista
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{mutuo.banca}</h1>
              <span className={tipoTassoBadgeClass(mutuo.tipo_tasso)}>
                {tipoTassoLabel(mutuo.tipo_tasso)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Inserito il {new Date(mutuo.created_at).toLocaleDateString('it-IT')}
            </p>
          </div>
          {mutuo.punteggio != null && (
            <div className={`px-5 py-3 rounded-2xl text-center ${punteggioBgColor(mutuo.punteggio)}`}>
              <p className={`text-3xl font-bold ${punteggioColor(mutuo.punteggio)}`}>{mutuo.punteggio}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">punteggio</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="label">Rata Mensile</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(mutuo.rata_mensile ?? 0)}</p>
        </div>
        <div className="card p-5">
          <p className="label">TAN</p>
          <p className="text-xl font-bold text-primary-700">{formatPercent(mutuo.tan)}</p>
        </div>
        <div className="card p-5">
          <p className="label">Costo Totale</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(mutuo.costo_totale ?? 0)}</p>
        </div>
        <div className="card p-5">
          <p className="label">LTV</p>
          <p className="text-xl font-bold text-gray-900">{formatPercent(mutuo.ltv ?? 0)}</p>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Parametri Mutuo</h3>
          <dl className="space-y-3">
            {[
              ['Importo', formatCurrency(mutuo.importo)],
              ['Valore Immobile', formatCurrency(mutuo.valore_immobile)],
              ['Durata', `${mutuo.durata_anni} anni`],
              ['TAN', formatPercent(mutuo.tan)],
              ['TAEG', mutuo.taeg ? formatPercent(mutuo.taeg) : '\u2014'],
              ['Spread', mutuo.spread ? formatPercent(mutuo.spread) : '\u2014'],
              ['Totale Interessi', formatCurrency(mutuo.totale_interessi ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Spese</h3>
          <dl className="space-y-3">
            {[
              ['Istruttoria', formatCurrency(mutuo.spese_istruttoria)],
              ['Perizia', formatCurrency(mutuo.spese_perizia)],
              ['Assicurazione', formatCurrency(mutuo.costo_assicurazione)],
              ['Notarili', formatCurrency(mutuo.spese_notarili)],
              ['Altre', formatCurrency(mutuo.altre_spese)],
              ['Totale Spese', formatCurrency(mutuo.spese_istruttoria + mutuo.spese_perizia + mutuo.costo_assicurazione + mutuo.spese_notarili + mutuo.altre_spese)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {mutuo.note && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Note</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{mutuo.note}</p>
        </div>
      )}

      {/* Charts */}
      {yearlyData.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-primary-600" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Piano di Ammortamento</h2>
          </div>

          <div className="card p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Debito Residuo nel Tempo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="anno" tick={{ fontSize: 12 }} label={{ value: 'Anno', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `\u20ac${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} labelFormatter={(l) => `Anno ${l}`} />
                <Area type="monotone" dataKey="residuo" stroke="#4c6ef5" fill="#dbe4ff" name="Debito Residuo" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Capitale vs Interessi per Anno</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="anno" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `\u20ac${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} labelFormatter={(l) => `Anno ${l}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="capitale" fill="#20c997" name="Quota Capitale" radius={[2, 2, 0, 0]} />
                <Bar dataKey="interessi" fill="#ff6b6b" name="Quota Interessi" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
