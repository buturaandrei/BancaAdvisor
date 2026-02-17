import { useState } from 'react'
import { Mutuo } from '../types'
import { formatCurrency, formatPercent, punteggioColor, punteggioBgColor, tipoTassoBadgeClass, tipoTassoLabel } from '../utils/format'
import { TrendingUp, Eye, Trash2, Trophy, Printer, Settings, Check } from 'lucide-react'

interface Props {
  mutui: Mutuo[]
  onView: (id: number) => void
  onDelete: (id: number) => void
  selectedIds: number[]
  onToggleSelect: (id: number) => void
  onPrint: () => void
  eurirs30y: number | null
  onSaveEurirs: (value: number) => void
}

export default function Dashboard({ mutui, onView, onDelete, selectedIds, onToggleSelect, onPrint, eurirs30y, onSaveEurirs }: Props) {
  const [eurirsInput, setEurirsInput] = useState(eurirs30y?.toString() ?? '')
  const [showEurirs, setShowEurirs] = useState(false)

  if (mutui.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Nessun mutuo inserito</h2>
        <p className="text-sm text-gray-500">Inizia aggiungendo le offerte delle banche che stai valutando</p>
      </div>
    )
  }

  const best = mutui.reduce((a, b) => ((a.punteggio ?? 0) > (b.punteggio ?? 0) ? a : b))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="label">Mutui Inseriti</p>
          <p className="text-2xl font-bold text-gray-900">{mutui.length}</p>
        </div>
        <div className="card p-5">
          <p className="label">Miglior Offerta</p>
          <p className="text-2xl font-bold text-primary-700">{best.banca}</p>
        </div>
        <div className="card p-5">
          <p className="label">Rata Più Bassa</p>
          <p className="text-2xl font-bold text-accent-700">
            {formatCurrency(Math.min(...mutui.map(m => m.rata_mensile ?? Infinity)))}
          </p>
        </div>
        <div className="card p-5">
          <p className="label">TAN Più Basso</p>
          <p className="text-2xl font-bold text-green-700">
            {formatPercent(Math.min(...mutui.map(m => m.tan)))}
          </p>
        </div>
      </div>

      {/* Eurirs Setting */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowEurirs(!showEurirs); if (!showEurirs && eurirs30y) setEurirsInput(eurirs30y.toString()) }}
              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50"
              title="Impostazioni Eurirs"
            >
              <Settings size={16} />
            </button>
            <div className="text-sm">
              <span className="text-gray-500">Eurirs 30 anni: </span>
              {eurirs30y != null ? (
                <strong className="text-gray-900">{formatPercent(eurirs30y)}</strong>
              ) : (
                <span className="text-amber-600 text-xs">Non impostato — clicca ⚙ per inserirlo</span>
              )}
            </div>
          </div>
          {eurirs30y != null && (
            <p className="text-xs text-gray-400">Spread calcolato = TAN − Eurirs</p>
          )}
        </div>
        {showEurirs && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
            <label className="text-xs text-gray-500 whitespace-nowrap">Eurirs 30Y (%):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={eurirsInput}
              onChange={(e) => setEurirsInput(e.target.value)}
              className="input-field !w-28 !py-1.5 text-sm"
              placeholder="es. 3.09"
            />
            <button
              onClick={() => {
                const v = parseFloat(eurirsInput)
                if (!isNaN(v) && v >= 0 && v <= 10) {
                  onSaveEurirs(v)
                  setShowEurirs(false)
                }
              }}
              className="btn-primary !py-1.5 !px-3 text-sm flex items-center gap-1"
            >
              <Check size={14} />
              Salva
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Le tue offerte
          </h2>
          <div className="flex items-center gap-3">
            {selectedIds.length >= 2 && (
              <span className="text-xs text-primary-600 font-medium">
                {selectedIds.length} selezionati per confronto
              </span>
            )}
            <button
              onClick={onPrint}
              className="btn-secondary flex items-center gap-2 !py-2 text-sm no-print"
              title="Stampa report comparativo"
            >
              <Printer size={16} />
              Stampa Report
            </button>
          </div>
        </div>

        {mutui.map((m) => (
          <div
            key={m.id}
            className={`card p-5 cursor-pointer ${
              selectedIds.includes(m.id) ? 'ring-2 ring-primary-400 border-primary-200' : ''
            }`}
            onClick={() => onToggleSelect(m.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => onToggleSelect(m.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900">{m.banca}</h3>
                    {m.id === best.id && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Trophy size={12} />
                        Migliore
                      </span>
                    )}
                    <span className={tipoTassoBadgeClass(m.tipo_tasso)}>
                      {tipoTassoLabel(m.tipo_tasso)}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>TAN <strong className="text-gray-900">{formatPercent(m.tan)}</strong></span>
                    {m.taeg && <span>TAEG <strong className="text-gray-900">{formatPercent(m.taeg)}</strong></span>}
                    <span>Rata <strong className="text-gray-900">{formatCurrency(m.rata_mensile ?? 0)}</strong></span>
                    <span>Durata <strong className="text-gray-900">{m.durata_anni} anni</strong></span>
                    <span>Importo <strong className="text-gray-900">{formatCurrency(m.importo)}</strong></span>
                  </div>
                  {/* Spread info */}
                  {eurirs30y != null && m.tipo_tasso === 'fisso' && (
                    <div className="mt-1 text-xs text-gray-400">
                      Spread calcolato: <strong className="text-gray-600">{formatPercent(Math.max(0, +(m.tan - eurirs30y).toFixed(2)))}</strong>
                      <span className="ml-1">(TAN {formatPercent(m.tan)} − Eurirs {formatPercent(eurirs30y)})</span>
                    </div>
                  )}
                  {m.spread != null && m.spread > 0 && (
                    <div className="mt-0.5 text-xs text-gray-400">
                      Spread dichiarato dalla banca: <strong className="text-gray-600">{formatPercent(m.spread)}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {m.punteggio != null && (
                  <div className={`px-3 py-1.5 rounded-xl text-center ${punteggioBgColor(m.punteggio)}`}>
                    <p className={`text-lg font-bold ${punteggioColor(m.punteggio)}`}>{m.punteggio}</p>
                    <p className="text-[10px] text-gray-500 uppercase">punti</p>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onView(m.id) }}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  title="Dettaglio"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(m.id) }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Elimina"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Cost summary bar */}
            {m.costo_totale != null && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex gap-6 text-xs text-gray-500">
                <span>Costo totale: <strong className="text-gray-700">{formatCurrency(m.costo_totale)}</strong></span>
                <span>Interessi: <strong className="text-gray-700">{formatCurrency(m.totale_interessi ?? 0)}</strong></span>
                <span>LTV: <strong className="text-gray-700">{formatPercent(m.ltv ?? 0)}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
