import { useState } from 'react'
import { Mutuo } from '../types'
import { formatCurrency, formatPercent, punteggioColor, punteggioBgColor, tipoTassoBadgeClass, tipoTassoLabel } from '../utils/format'
import { TrendingUp, Eye, Trash2, Trophy, Printer, Settings, Check, Download, Upload } from 'lucide-react'

interface Props {
  mutui: Mutuo[]
  onView: (id: number) => void
  onDelete: (id: number) => void
  selectedIds: number[]
  onToggleSelect: (id: number) => void
  onPrint: () => void
  eurirs30y: number | null
  onSaveEurirs: (value: number) => void
  onExport: () => void
  onImport: (file: File) => void
}

export default function Dashboard({ mutui, onView, onDelete, selectedIds, onToggleSelect, onPrint, eurirs30y, onSaveEurirs, onExport, onImport }: Props) {
  const [eurirsInput, setEurirsInput] = useState(eurirs30y?.toString() ?? '')
  const [showEurirs, setShowEurirs] = useState(false)

  if (mutui.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Nessun mutuo inserito</h2>
        <p className="text-sm text-gray-500 mb-4">Inizia aggiungendo le offerte delle banche che stai valutando</p>
        <label className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Upload size={16} />
          Importa dati
          <input type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); e.target.value = '' }} />
        </label>
      </div>
    )
  }

  const best = mutui.reduce((a, b) => ((a.punteggio ?? 0) > (b.punteggio ?? 0) ? a : b))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-5">
          <p className="label">Mutui</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{mutui.length}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="label">Migliore</p>
          <p className="text-lg sm:text-2xl font-bold text-primary-700 truncate">{best.banca}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="label">Rata Min.</p>
          <p className="text-lg sm:text-2xl font-bold text-accent-700">
            {formatCurrency(Math.min(...mutui.map(m => m.rata_mensile ?? Infinity)))}
          </p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="label">TAN Min.</p>
          <p className="text-lg sm:text-2xl font-bold text-green-700">
            {formatPercent(Math.min(...mutui.map(m => m.tan)))}
          </p>
        </div>
      </div>

      {/* Eurirs Setting */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => { setShowEurirs(!showEurirs); if (!showEurirs && eurirs30y) setEurirsInput(eurirs30y.toString()) }}
              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50 flex-shrink-0"
              title="Impostazioni Eurirs"
            >
              <Settings size={16} />
            </button>
            <div className="text-sm min-w-0">
              <span className="text-gray-500">Eurirs 30Y: </span>
              {eurirs30y != null ? (
                <strong className="text-gray-900">{formatPercent(eurirs30y)}</strong>
              ) : (
                <span className="text-amber-600 text-xs">Non impostato</span>
              )}
            </div>
          </div>
          {eurirs30y != null && (
            <p className="text-xs text-gray-400 hidden sm:block">Spread = TAN − Eurirs</p>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Le tue offerte
          </h2>
          <div className="flex items-center gap-2 sm:gap-3">
            {selectedIds.length >= 2 && (
              <span className="text-xs text-primary-600 font-medium">
                {selectedIds.length} selezionati
              </span>
            )}
            <button
              onClick={onExport}
              className="btn-secondary flex items-center gap-1.5 !py-2 !px-3 text-xs sm:text-sm no-print"
              title="Esporta dati"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Esporta</span>
            </button>
            <label
              className="btn-secondary flex items-center gap-1.5 !py-2 !px-3 text-xs sm:text-sm no-print cursor-pointer"
              title="Importa dati"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importa</span>
              <input type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); e.target.value = '' }} />
            </label>
            <button
              onClick={onPrint}
              className="btn-secondary flex items-center gap-1.5 sm:gap-2 !py-2 !px-3 sm:!px-5 text-xs sm:text-sm no-print"
              title="Stampa report comparativo"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Stampa Report</span>
              <span className="sm:hidden">Stampa</span>
            </button>
          </div>
        </div>

        {mutui.map((m) => (
          <div
            key={m.id}
            className={`card p-3 sm:p-5 cursor-pointer ${
              selectedIds.includes(m.id) ? 'ring-2 ring-primary-400 border-primary-200' : ''
            }`}
            onClick={() => onToggleSelect(m.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 sm:gap-4 min-w-0 flex-1">
                <div className="flex items-center pt-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => onToggleSelect(m.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{m.banca}</h3>
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
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-1 sm:gap-x-6 text-xs sm:text-sm text-gray-600">
                    <span>TAN <strong className="text-gray-900">{formatPercent(m.tan)}</strong></span>
                    {m.taeg && <span>TAEG <strong className="text-gray-900">{formatPercent(m.taeg)}</strong></span>}
                    <span>Rata <strong className="text-gray-900">{formatCurrency(m.rata_mensile ?? 0)}</strong></span>
                    <span>{m.durata_anni}a · {formatCurrency(m.importo)}</span>
                  </div>
                  {/* Spread info */}
                  {eurirs30y != null && m.tipo_tasso === 'fisso' && (
                    <div className="mt-1 text-xs text-gray-400">
                      Spread: <strong className="text-gray-600">{formatPercent(Math.max(0, +(m.tan - eurirs30y).toFixed(2)))}</strong>
                    </div>
                  )}
                  {m.spread != null && m.spread > 0 && (
                    <div className="mt-0.5 text-xs text-gray-400">
                      Spread banca: <strong className="text-gray-600">{formatPercent(m.spread)}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                {m.punteggio != null && (
                  <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center ${punteggioBgColor(m.punteggio)}`}>
                    <p className={`text-base sm:text-lg font-bold ${punteggioColor(m.punteggio)}`}>{m.punteggio}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase">punti</p>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onView(m.id) }}
                  className="p-2 sm:p-2 text-gray-400 hover:text-primary-600 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Dettaglio"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(m.id) }}
                  className="p-2 sm:p-2 text-gray-400 hover:text-red-500 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Elimina"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Cost summary bar */}
            {m.costo_totale != null && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-50 flex flex-wrap gap-x-4 gap-y-1 sm:gap-6 text-xs text-gray-500">
                <span>Totale: <strong className="text-gray-700">{formatCurrency(m.costo_totale)}</strong></span>
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
