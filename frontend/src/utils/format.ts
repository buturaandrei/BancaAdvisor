export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function tipoTassoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    fisso: 'Tasso Fisso',
    variabile: 'Tasso Variabile',
    misto: 'Tasso Misto',
  }
  return labels[tipo] || tipo
}

export function tipoTassoBadgeClass(tipo: string): string {
  const classes: Record<string, string> = {
    fisso: 'badge-fisso',
    variabile: 'badge-variabile',
    misto: 'badge-misto',
  }
  return classes[tipo] || 'badge'
}

export function punteggioColor(punteggio: number): string {
  if (punteggio >= 80) return 'text-green-600'
  if (punteggio >= 60) return 'text-accent-600'
  if (punteggio >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function punteggioBgColor(punteggio: number): string {
  if (punteggio >= 80) return 'bg-green-50'
  if (punteggio >= 60) return 'bg-accent-50'
  if (punteggio >= 40) return 'bg-amber-50'
  return 'bg-red-50'
}
