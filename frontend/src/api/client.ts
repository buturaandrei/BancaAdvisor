const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    let message = 'Errore nella richiesta'
    if (typeof err.detail === 'string') {
      message = err.detail
    } else if (Array.isArray(err.detail)) {
      message = err.detail.map((e: { msg?: string; loc?: string[] }) => {
        const field = e.loc?.slice(-1)[0] || ''
        return field ? `${field}: ${e.msg}` : (e.msg || '')
      }).filter(Boolean).join('\n')
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Mutui
  listaMutui: () => request<import('../types').Mutuo[]>('/mutui/'),
  creaMutuo: (data: import('../types').MutuoForm) =>
    request<import('../types').Mutuo>('/mutui/', { method: 'POST', body: JSON.stringify(data) }),
  dettaglioMutuo: (id: number) => request<import('../types').Mutuo>(`/mutui/${id}`),
  aggiornaMutuo: (id: number, data: Partial<import('../types').MutuoForm>) =>
    request<import('../types').Mutuo>(`/mutui/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminaMutuo: (id: number) =>
    request<void>(`/mutui/${id}`, { method: 'DELETE' }),
  pianoAmmortamento: (id: number) =>
    request<{ mutuo_id: number; piano: import('../types').AmortizationRow[] }>(`/mutui/${id}/ammortamento`),

  // Confronto
  confrontaMutui: (ids: number[]) =>
    request<import('../types').ComparisonResult>('/confronto/', { method: 'POST', body: JSON.stringify(ids) }),

  // Advisor
  statoAdvisor: () => request<import('../types').AdvisorStatus>('/advisor/status'),
  chiediConsulenza: (mutuo_ids: number[], domanda?: string) =>
    request<{ risposta: string; mutuo_ids: number[] }>('/advisor/consulenza', {
      method: 'POST',
      body: JSON.stringify({ mutuo_ids, domanda }),
    }),
  storicoConsulenze: () => request<import('../types').Consulenza[]>('/advisor/storico'),

  // Health
  health: () => request<{ status: string }>('/health'),

  // Settings
  getEurirs: () => request<{ eurirs_30y: number | null }>('/settings/eurirs'),
  setEurirs: (value: number) =>
    request<{ eurirs_30y: number }>('/settings/eurirs', { method: 'PUT', body: JSON.stringify({ eurirs_30y: value }) }),

  // Export/Import
  esportaDati: () => request<{ mutui: import('../types').Mutuo[]; settings: Record<string, string> }>('/mutui/export/all'),
  importaDati: (data: { mutui: import('../types').Mutuo[]; settings: Record<string, string> }) =>
    request<{ importati: number }>('/mutui/import/all', { method: 'POST', body: JSON.stringify(data) }),
}
