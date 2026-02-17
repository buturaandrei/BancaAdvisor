import { forwardRef } from 'react'
import type { Mutuo } from '../types'
import { formatCurrency, formatPercent, tipoTassoLabel } from '../utils/format'

interface Props {
  mutui: Mutuo[]
}

const s = {
  page: { fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px', color: '#1a1a1a', lineHeight: 1.5 } as React.CSSProperties,
  headerBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #1a1a1a', paddingBottom: '10px', marginBottom: '20px' } as React.CSSProperties,
  title: { fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 } as React.CSSProperties,
  subtitle: { fontSize: '11px', color: '#888', margin: 0 } as React.CSSProperties,
  meta: { textAlign: 'right' as const, fontSize: '10px', color: '#888' } as React.CSSProperties,
  sectionTitle: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#444', marginBottom: '8px', marginTop: '22px', borderBottom: '1px solid #ddd', paddingBottom: '4px' } as React.CSSProperties,
  summaryBox: { display: 'flex', gap: '0', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', marginBottom: '18px' } as React.CSSProperties,
  summaryCell: { flex: 1, padding: '10px 14px', borderRight: '1px solid #eee' } as React.CSSProperties,
  summaryCellLast: { flex: 1, padding: '10px 14px' } as React.CSSProperties,
  summaryLabel: { fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: '#999', margin: '0 0 2px 0' } as React.CSSProperties,
  summaryValue: { fontSize: '13px', fontWeight: 700, margin: 0 } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '10px', marginBottom: '16px' } as React.CSSProperties,
  th: { backgroundColor: '#f5f5f5', border: '1px solid #ddd', padding: '5px 8px', fontWeight: 600, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#555' } as React.CSSProperties,
  thR: { backgroundColor: '#f5f5f5', border: '1px solid #ddd', padding: '5px 8px', fontWeight: 600, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#555', textAlign: 'right' as const } as React.CSSProperties,
  td: { border: '1px solid #e5e5e5', padding: '4px 8px' } as React.CSSProperties,
  tdR: { border: '1px solid #e5e5e5', padding: '4px 8px', textAlign: 'right' as const } as React.CSSProperties,
  bestRow: { backgroundColor: '#f0faf0' } as React.CSSProperties,
  cardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } as React.CSSProperties,
  card: { border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', fontSize: '10px', pageBreakInside: 'avoid' as const } as React.CSSProperties,
  cardBest: { border: '2px solid #333', borderRadius: '6px', padding: '10px 12px', fontSize: '10px', pageBreakInside: 'avoid' as const } as React.CSSProperties,
  cardTitle: { fontSize: '12px', fontWeight: 700, marginBottom: '6px' } as React.CSSProperties,
  cardFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 16px' } as React.CSSProperties,
  cardField: { margin: 0, color: '#555' } as React.CSSProperties,
  noteBox: { border: '1px solid #ddd', borderRadius: '6px', padding: '12px', marginTop: '20px', pageBreakInside: 'avoid' as const } as React.CSSProperties,
  noteLine: { borderBottom: '1px dashed #ccc', height: '24px' } as React.CSSProperties,
  footer: { marginTop: '20px', paddingTop: '8px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa' } as React.CSSProperties,
  star: { display: 'inline-block', color: '#d4a017', marginLeft: '4px', fontSize: '12px' } as React.CSSProperties,
  section: { pageBreakInside: 'avoid' as const } as React.CSSProperties,
}

const PrintReport = forwardRef<HTMLDivElement, Props>(({ mutui }, ref) => {
  if (mutui.length === 0) return null

  const sorted = [...mutui].sort((a, b) => (a.costo_totale ?? 0) - (b.costo_totale ?? 0))
  const best = sorted[0]
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div ref={ref} className="print-report hidden print:block" style={s.page}>
      {/* Header */}
      <div style={s.headerBar}>
        <div>
          <h1 style={s.title}>BancaAdvisor</h1>
          <p style={s.subtitle}>Report Comparativo Mutui</p>
        </div>
        <div style={s.meta}>
          <p style={{ margin: 0 }}>{today}</p>
          <p style={{ margin: 0 }}>{mutui.length} offerte analizzate</p>
        </div>
      </div>

      {/* Riepilogo rapido */}
      <div style={{ ...s.summaryBox, pageBreakInside: 'avoid' as const }}>
        <div style={s.summaryCell}>
          <p style={s.summaryLabel}>Miglior Offerta</p>
          <p style={s.summaryValue}>{best.banca}</p>
        </div>
        <div style={s.summaryCell}>
          <p style={s.summaryLabel}>Costo Totale Migliore</p>
          <p style={s.summaryValue}>{formatCurrency(best.costo_totale ?? 0)}</p>
        </div>
        <div style={s.summaryCell}>
          <p style={s.summaryLabel}>Rata Pi\u00f9 Bassa</p>
          <p style={s.summaryValue}>{formatCurrency(Math.min(...mutui.map(m => m.rata_mensile ?? Infinity)))}</p>
        </div>
        <div style={s.summaryCellLast}>
          <p style={s.summaryLabel}>TAN Pi\u00f9 Basso</p>
          <p style={s.summaryValue}>{formatPercent(Math.min(...mutui.map(m => m.tan)))}</p>
        </div>
      </div>

      {/* Tabella comparativa */}
      <div style={s.section}>
      <h2 style={s.sectionTitle}>Confronto Dettagliato</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: '20px' }}>#</th>
            <th style={s.th}>Banca</th>
            <th style={s.thR}>TAN</th>
            <th style={s.thR}>TAEG</th>
            <th style={s.thR}>Rata/mese</th>
            <th style={s.thR}>Durata</th>
            <th style={s.thR}>Tot. Interessi</th>
            <th style={s.thR}>Costo Totale</th>
            <th style={{ ...s.thR, width: '55px' }}>Punti</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => (
            <tr key={m.id} style={i === 0 ? s.bestRow : {}}>
              <td style={{ ...s.td, fontWeight: i === 0 ? 700 : 400 }}>{i + 1}</td>
              <td style={{ ...s.td, fontWeight: i === 0 ? 700 : 400 }}>
                {m.banca}{i === 0 && <span style={s.star}>\u2605</span>}
                <br /><span style={{ color: '#999', fontSize: '9px' }}>{tipoTassoLabel(m.tipo_tasso)} \u00b7 {formatCurrency(m.importo)}</span>
              </td>
              <td style={{ ...s.tdR, fontWeight: i === 0 ? 700 : 400 }}>{formatPercent(m.tan)}</td>
              <td style={s.tdR}>{m.taeg ? formatPercent(m.taeg) : '\u2014'}</td>
              <td style={{ ...s.tdR, fontWeight: i === 0 ? 700 : 400 }}>{formatCurrency(m.rata_mensile ?? 0)}</td>
              <td style={s.tdR}>{m.durata_anni}a</td>
              <td style={s.tdR}>{formatCurrency(m.totale_interessi ?? 0)}</td>
              <td style={{ ...s.tdR, fontWeight: 700 }}>{formatCurrency(m.costo_totale ?? 0)}</td>
              <td style={{ ...s.tdR, fontWeight: 600 }}>{m.punteggio ?? '\u2014'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Spese accessorie */}
      <div style={s.section}>
      <h2 style={s.sectionTitle}>Spese Accessorie</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Banca</th>
            <th style={s.thR}>Istruttoria</th>
            <th style={s.thR}>Perizia</th>
            <th style={s.thR}>Assicurazione</th>
            <th style={s.thR}>Notarili</th>
            <th style={s.thR}>Altre</th>
            <th style={s.thR}>Totale</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const tot = m.spese_istruttoria + m.spese_perizia + m.costo_assicurazione + m.spese_notarili + m.altre_spese
            return (
              <tr key={m.id}>
                <td style={s.td}>{m.banca}</td>
                <td style={s.tdR}>{formatCurrency(m.spese_istruttoria)}</td>
                <td style={s.tdR}>{formatCurrency(m.spese_perizia)}</td>
                <td style={s.tdR}>{formatCurrency(m.costo_assicurazione)}</td>
                <td style={s.tdR}>{formatCurrency(m.spese_notarili)}</td>
                <td style={s.tdR}>{formatCurrency(m.altre_spese)}</td>
                <td style={{ ...s.tdR, fontWeight: 700 }}>{formatCurrency(tot)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      {/* Schede dettaglio */}
      <h2 style={s.sectionTitle}>Schede Dettaglio</h2>
      <div style={s.cardGrid}>
        {sorted.map((m, i) => (
          <div key={m.id} style={i === 0 ? s.cardBest : s.card}>
            <div style={s.cardTitle}>
              {i + 1}. {m.banca}{i === 0 && <span style={s.star}>\u2605</span>}
            </div>
            <div style={s.cardFields}>
              <p style={s.cardField}>Tipo: <strong>{tipoTassoLabel(m.tipo_tasso)}</strong></p>
              <p style={s.cardField}>Importo: <strong>{formatCurrency(m.importo)}</strong></p>
              <p style={s.cardField}>TAN: <strong>{formatPercent(m.tan)}</strong></p>
              <p style={s.cardField}>TAEG: <strong>{m.taeg ? formatPercent(m.taeg) : '\u2014'}</strong></p>
              <p style={s.cardField}>Spread: <strong>{m.spread ? formatPercent(m.spread) : '\u2014'}</strong></p>
              <p style={s.cardField}>Durata: <strong>{m.durata_anni} anni</strong></p>
              <p style={s.cardField}>Rata: <strong>{formatCurrency(m.rata_mensile ?? 0)}</strong></p>
              <p style={s.cardField}>LTV: <strong>{formatPercent(m.ltv ?? 0)}</strong></p>
              <p style={s.cardField}>Interessi: <strong>{formatCurrency(m.totale_interessi ?? 0)}</strong></p>
              <p style={s.cardField}>Costo totale: <strong>{formatCurrency(m.costo_totale ?? 0)}</strong></p>
            </div>
            {m.note && (
              <p style={{ ...s.cardField, marginTop: '4px', fontSize: '9px' }}>
                Note: {m.note.slice(0, 150)}{m.note.length > 150 ? '...' : ''}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Appunti */}
      <div style={s.noteBox}>
        <h2 style={{ ...s.sectionTitle, marginTop: 0 }}>Appunti</h2>
        {[...Array(5)].map((_, i) => <div key={i} style={s.noteLine} />)}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span>Generato da BancaAdvisor \u2014 {today}</span>
        <span>I dati sono indicativi. Verificare sempre con la banca.</span>
      </div>
    </div>
  )
})

PrintReport.displayName = 'PrintReport'

export default PrintReport
