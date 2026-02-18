export interface Mutuo {
  id: number
  banca: string
  tipo_tasso: 'fisso' | 'variabile' | 'misto'
  tan: number
  taeg: number | null
  spread: number | null
  importo: number
  valore_immobile: number
  durata_anni: number
  rata_mensile: number | null
  spese_istruttoria: number
  spese_perizia: number
  costo_assicurazione: number
  spese_notarili: number
  altre_spese: number
  note: string | null
  ltv: number | null
  costo_totale: number | null
  totale_interessi: number | null
  punteggio: number | null
  verificato: boolean
  created_at: string
  updated_at: string
}

export interface MutuoForm {
  banca: string
  tipo_tasso: 'fisso' | 'variabile' | 'misto'
  tan: number
  taeg?: number
  spread?: number
  importo: number
  valore_immobile: number
  durata_anni: number
  spese_istruttoria: number
  spese_perizia: number
  costo_assicurazione: number
  spese_notarili: number
  altre_spese: number
  note?: string
}

export interface AmortizationRow {
  mese: number
  rata: number
  quota_capitale: number
  quota_interessi: number
  debito_residuo: number
}

export interface ComparisonResult {
  mutui: Mutuo[]
  classifica: ClassificaItem[]
  migliore_id: number
  analisi: string
}

export interface ClassificaItem {
  id: number
  banca: string
  punteggio: number
  rata_mensile: number
  costo_totale: number
  tan: number
  taeg: number | null
}

export interface AdvisorStatus {
  ollama_online: boolean
  modello_disponibile: boolean
  modello: string
  modelli_installati: string[]
}

export interface Consulenza {
  id: number
  mutuo_ids: number[]
  domanda: string
  risposta: string
  created_at: string
}

export type ViewMode = 'dashboard' | 'nuovo' | 'modifica' | 'confronto' | 'advisor' | 'dettaglio'
