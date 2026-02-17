import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { Mutuo, ComparisonResult } from '../types'
import { formatCurrency, formatPercent, punteggioColor, punteggioBgColor } from '../utils/format'
import { GitCompareArrows, Trophy, Sparkles } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface Props {
  selectedIds: number[]
  mutui: Mutuo[]
}

const CHART_COLORS = ['#4c6ef5', '#20c997', '#fab005', '#ff6b6b', '#845ef7', '#339af0']

export default function ComparisonView({ selectedIds, mutui }: Props) {
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedIds.length >= 2) {
      loadComparison()
    }
  }, [selectedIds])

  async function loadComparison() {
    setLoading(true)
    setError('')
    try {
      const res = await api.confrontaMutui(selectedIds)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nel confronto')
    }
    setLoading(false)
  }

  if (selectedIds.length < 2) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GitCompareArrows size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Seleziona almeno 2 mutui</h2>
        <p className="text-sm text-gray-500">
          Torna alla Dashboard e seleziona i mutui da confrontare
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse-soft text-gray-400">Confronto in corso...</div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>
  }

  if (!result) return null

  const selected = mutui.filter(m => selectedIds.includes(m.id))

  // Radar chart data
  const maxRata = Math.max(...selected.map(m => m.rata_mensile ?? 0))
  const maxCosto = Math.max(...selected.map(m => m.costo_totale ?? 0))
  const maxTan = Math.max(...selected.map(m => m.tan))
  const maxSpese = Math.max(...selected.map(m =>
    (m.spese_istruttoria + m.spese_perizia + m.costo_assicurazione + m.spese_notarili + m.altre_spese) || 1
  ))

  const radarData = [
    { metrica: 'Rata Bassa', ...Object.fromEntries(selected.map(m => [m.banca, Math.round(((maxRata - (m.rata_mensile ?? 0)) / maxRata) * 100) || 0])) },
    { metrica: 'Costo Basso', ...Object.fromEntries(selected.map(m => [m.banca, Math.round(((maxCosto - (m.costo_totale ?? 0)) / maxCosto) * 100) || 0])) },
    { metrica: 'TAN Basso', ...Object.fromEntries(selected.map(m => [m.banca, Math.round(((maxTan - m.tan) / maxTan) * 100) || 0])) },
    { metrica: 'LTV Basso', ...Object.fromEntries(selected.map(m => [m.banca, Math.round(100 - (m.ltv ?? 0))])) },
    { metrica: 'Spese Basse', ...Object.fromEntries(selected.map(m => {
      const spese = m.spese_istruttoria + m.spese_perizia + m.costo_assicurazione + m.spese_notarili + m.altre_spese
      return [m.banca, Math.round(((maxSpese - spese) / maxSpese) * 100) || 0]
    })) },
    { metrica: 'Punteggio', ...Object.fromEntries(selected.map(m => [m.banca, m.punteggio ?? 0])) },
  ]

  // Bar chart for rate comparison
  const rateData = selected.map(m => ({
    banca: m.banca,
    rata: m.rata_mensile ?? 0,
  }))

  const costoData = selected.map(m => ({
    banca: m.banca,
    interessi: m.totale_interessi ?? 0,
    spese: m.spese_istruttoria + m.spese_perizia + m.costo_assicurazione + m.spese_notarili + m.altre_spese,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GitCompareArrows size={20} className="text-primary-600" />
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Confronto {selected.length} Mutui
        </h2>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {result.classifica.map((c, i) => (
          <div
            key={c.id}
            className={`card p-3 sm:p-5 ${i === 0 ? 'ring-2 ring-amber-400 border-amber-200' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {i === 0 ? <Trophy size={18} /> : i + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{c.banca}</h3>
                  <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-0.5 text-xs sm:text-sm text-gray-500">
                    <span>Rata: <strong className="text-gray-700">{formatCurrency(c.rata_mensile)}</strong></span>
                    <span>TAN: <strong className="text-gray-700">{formatPercent(c.tan)}</strong></span>
                    <span className="hidden sm:inline">Costo: <strong className="text-gray-700">{formatCurrency(c.costo_totale)}</strong></span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex-shrink-0 ${punteggioBgColor(c.punteggio)}`}>
                <span className={`text-xl sm:text-2xl font-bold ${punteggioColor(c.punteggio)}`}>
                  {c.punteggio}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 ml-1">/100</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Analisi</h3>
        </div>
        <pre className="text-sm text-gray-600 font-sans whitespace-pre-wrap leading-relaxed">{result.analisi}</pre>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4 sm:p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Radar Comparativo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metrica" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {selected.map((m, i) => (
                <Radar
                  key={m.id}
                  name={m.banca}
                  dataKey={m.banca}
                  stroke={CHART_COLORS[i]}
                  fill={CHART_COLORS[i]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 sm:p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Rata Mensile</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `\u20ac${v}`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="banca" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Rata']} />
              <Bar dataKey="rata" fill="#4c6ef5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Composizione Costi</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={costoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="banca" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `\u20ac${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="interessi" stackId="a" fill="#ff6b6b" name="Interessi" radius={[0, 0, 0, 0]} />
            <Bar dataKey="spese" stackId="a" fill="#fab005" name="Spese Accessorie" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parametro</th>
                {selected.map(m => (
                  <th key={m.id} className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {m.banca}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['Rata Mensile', (m: Mutuo) => formatCurrency(m.rata_mensile ?? 0)],
                ['TAN', (m: Mutuo) => formatPercent(m.tan)],
                ['TAEG', (m: Mutuo) => m.taeg ? formatPercent(m.taeg) : '\u2014'],
                ['Importo', (m: Mutuo) => formatCurrency(m.importo)],
                ['Durata', (m: Mutuo) => `${m.durata_anni} anni`],
                ['Tipo Tasso', (m: Mutuo) => m.tipo_tasso.charAt(0).toUpperCase() + m.tipo_tasso.slice(1)],
                ['LTV', (m: Mutuo) => formatPercent(m.ltv ?? 0)],
                ['Totale Interessi', (m: Mutuo) => formatCurrency(m.totale_interessi ?? 0)],
                ['Costo Totale', (m: Mutuo) => formatCurrency(m.costo_totale ?? 0)],
                ['Spese Istruttoria', (m: Mutuo) => formatCurrency(m.spese_istruttoria)],
                ['Spese Perizia', (m: Mutuo) => formatCurrency(m.spese_perizia)],
                ['Assicurazione', (m: Mutuo) => formatCurrency(m.costo_assicurazione)],
                ['Spese Notarili', (m: Mutuo) => formatCurrency(m.spese_notarili)],
                ['Punteggio', (m: Mutuo) => `${m.punteggio ?? 0}/100`],
              ].map(([label, fn]) => (
                <tr key={label as string} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-600 font-medium">{label as string}</td>
                  {selected.map(m => (
                    <td key={m.id} className="px-5 py-3 text-right text-gray-900 font-medium">
                      {(fn as (m: Mutuo) => string)(m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
