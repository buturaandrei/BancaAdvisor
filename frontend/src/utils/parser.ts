import type { MutuoForm } from '../types'

/**
 * Converte un numero in formato italiano (es. "180.000" o "808,28") in un float JS.
 */
function parseItalianNumber(raw: string): number {
  // Rimuovi spazi e simbolo €
  let cleaned = raw.replace(/[€\s]/g, '')

  // Formato italiano: 180.000,28 → 180000.28
  // Se contiene sia punti che virgola, il punto è separatore migliaia
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    // Solo virgola: potrebbe essere decimale (808,28) o migliaia (180,000)
    const parts = cleaned.split(',')
    if (parts[1] && parts[1].length === 3 && parseFloat(parts[0]) < 1000) {
      // Probabilmente migliaia US-style, ma raro in contesto italiano
      cleaned = cleaned.replace(',', '')
    } else {
      cleaned = cleaned.replace(',', '.')
    }
  } else if (cleaned.includes('.')) {
    // Solo punti: potrebbe essere migliaia (180.000) o decimale (3.50)
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length === 3) {
      // Separatore migliaia: 180.000
      cleaned = cleaned.replace('.', '')
    }
    // Altrimenti lascia com'è (3.50 è un decimale)
  }

  const result = parseFloat(cleaned)
  return isNaN(result) ? 0 : result
}

/**
 * Cerca una percentuale in una riga di testo.
 */
function findPercent(text: string): number | null {
  const match = text.match(/([\d]+[.,][\d]+)\s*%/)
  if (match) {
    return parseItalianNumber(match[1])
  }
  const matchInt = text.match(/([\d]+)\s*%/)
  if (matchInt) {
    return parseInt(matchInt[1])
  }
  return null
}

/**
 * Cerca un importo in euro in una riga di testo.
 */
function findEuro(text: string): number | null {
  // Pattern: €, euro + numero
  const match = text.match(/€\s*([\d.,]+)/)
  if (match) return parseItalianNumber(match[1])

  // Pattern: numero + €/euro
  const match2 = text.match(/([\d.,]+)\s*(?:€|[Ee]uro)/)
  if (match2) return parseItalianNumber(match2[1])

  return null
}

/**
 * Parsa un testo copiato da un sito di confronto mutui
 * e restituisce un MutuoForm parziale + note estratte.
 */
export function parseMutuoText(text: string): { form: Partial<MutuoForm>; noteParts: string[]; campiTrovati: string[] } {
  const result: Partial<MutuoForm> = {}
  const campiTrovati: string[] = []
  const noteLines: string[] = []

  // Normalizza il testo: splitta per linee
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean)

  // === TIPO TASSO ===
  if (/tasso\s+fisso|fisso/i.test(text) && !/tasso\s+variabile|variabile/i.test(text)) {
    result.tipo_tasso = 'fisso'
    campiTrovati.push('Tipo Tasso → Fisso')
  } else if (/tasso\s+variabile|variabile/i.test(text) && !/tasso\s+fisso|fisso/i.test(text)) {
    result.tipo_tasso = 'variabile'
    campiTrovati.push('Tipo Tasso → Variabile')
  } else if (/tasso\s+misto|misto/i.test(text)) {
    result.tipo_tasso = 'misto'
    campiTrovati.push('Tipo Tasso → Misto')
  }

  // === IMPORTO ===
  for (const line of lines) {
    if (/importo\s+mutuo|importo\s+finanzi/i.test(line)) {
      const val = findEuro(line)
      if (val && val > 1000) {
        result.importo = val
        campiTrovati.push(`Importo → €${val.toLocaleString('it-IT')}`)
        break
      }
    }
  }

  // === DURATA ===
  for (const line of lines) {
    if (/durata/i.test(line)) {
      const match = line.match(/(\d+)\s*anni/i)
      if (match) {
        result.durata_anni = parseInt(match[1])
        campiTrovati.push(`Durata → ${match[1]} anni`)
        break
      }
    }
  }

  // === TAN ===
  // Cerca "TAN" esplicito
  for (const line of lines) {
    if (/\bTAN\b/i.test(line)) {
      const pct = findPercent(line)
      if (pct !== null && pct < 20) {
        result.tan = pct
        campiTrovati.push(`TAN → ${pct}%`)
        break
      }
    }
  }
  // Fallback: "Tasso Fisso: 3,50%" o "Tasso: X%"
  if (result.tan === undefined) {
    for (const line of lines) {
      if (/tasso\s+(fisso|variabile|finito)/i.test(line)) {
        const pct = findPercent(line)
        if (pct !== null && pct < 20) {
          result.tan = pct
          campiTrovati.push(`TAN → ${pct}% (da tasso finito)`)
          break
        }
      }
    }
  }

  // === TAEG ===
  for (const line of lines) {
    if (/\bTAEG\b/i.test(line)) {
      const pct = findPercent(line)
      if (pct !== null && pct < 20) {
        result.taeg = pct
        campiTrovati.push(`TAEG → ${pct}%`)
        break
      }
    }
  }

  // === SPREAD ===
  for (const line of lines) {
    if (/\bspread\b/i.test(line)) {
      const pct = findPercent(line)
      if (pct !== null && pct < 10) {
        result.spread = pct
        campiTrovati.push(`Spread → ${pct}%`)
        break
      }
    }
  }

  // === SPESE ISTRUTTORIA ===
  for (const line of lines) {
    if (/istruttoria/i.test(line)) {
      const val = findEuro(line)
      if (val !== null) {
        result.spese_istruttoria = val
        campiTrovati.push(`Spese Istruttoria → €${val}`)
        break
      }
    }
  }

  // === SPESE PERIZIA ===
  for (const line of lines) {
    if (/perizia/i.test(line) && !/sopralluogo|successiv/i.test(line)) {
      const val = findEuro(line)
      if (val !== null && val < 5000) {
        result.spese_perizia = val
        campiTrovati.push(`Spese Perizia → €${val}`)
        break
      }
    }
  }

  // === IMPOSTA SOSTITUTIVA / SPESE NOTARILI ===
  for (const line of lines) {
    if (/imposta\s+sostitutiva/i.test(line)) {
      const val = findEuro(line)
      if (val !== null) {
        result.spese_notarili = val
        campiTrovati.push(`Imposta Sostitutiva → €${val} (come spese notarili)`)
        break
      }
    }
  }

  // === ASSICURAZIONE ===
  for (const line of lines) {
    if (/assicurazion/i.test(line)) {
      const val = findEuro(line)
      if (val !== null && val > 0) {
        result.costo_assicurazione = val
        campiTrovati.push(`Assicurazione → €${val}`)
      }
      break
    }
  }

  // === NOTE: raccogli sezioni importanti ===
  const noteKeywords = [
    'destinatari', 'finalità', 'garanzi', 'penale estinzione', 'note',
    'assicurazion', 'spese periodiche', 'calcolo tasso'
  ]

  let currentSection = ''
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    const isSection = noteKeywords.some(k => lowerLine.startsWith(k))
    if (isSection) {
      currentSection = line
      noteLines.push(`\n📌 ${line}`)
    } else if (currentSection && line.length > 10) {
      noteLines.push(line)
    }
  }

  // Green bonus
  if (/green|classe\s+energetica/i.test(text)) {
    const greenMatch = text.match(/(-\s*[\d,]+%)\s*(?:per|acquisto|immobile|green)/i)
    if (greenMatch) {
      noteLines.push(`\n🌿 Sconto Green: ${greenMatch[1]}`)
    }
  }

  // Tronca le note a max 4500 caratteri per sicurezza
  let finalNotes = noteLines
  const joined = noteLines.join('\n')
  if (joined.length > 4500) {
    let total = 0
    finalNotes = []
    for (const line of noteLines) {
      if (total + line.length + 1 > 4500) break
      finalNotes.push(line)
      total += line.length + 1
    }
  }

  return { form: result, noteParts: finalNotes, campiTrovati }
}
