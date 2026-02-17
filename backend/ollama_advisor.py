import httpx
import json

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "gemma2:2b"


async def chiedi_consulenza(mutui_data: list[dict], domanda: str | None = None) -> str:
    """
    Chiede a Gemma 2B una consulenza finanziaria sui mutui forniti.
    """
    # Ordina mutui per costo totale (il pi\u00f9 conveniente prima)
    mutui_sorted = sorted(mutui_data, key=lambda m: m.get('costo_totale', 0) or 0)

    mutui_desc = []
    for i, m in enumerate(mutui_sorted, 1):
        lines = [
            f"MUTUO #{i}: {m['banca']}",
            f"  TAN: {m['tan']}%",
        ]
        if m.get('taeg'):
            lines.append(f"  TAEG: {m['taeg']}%")
        if m.get('spread'):
            lines.append(f"  Spread: {m['spread']}%")
        lines.extend([
            f"  Tipo tasso: {m['tipo_tasso']}",
            f"  Importo: \u20ac{m['importo']:,.0f}",
            f"  Durata: {m['durata_anni']} anni",
            f"  Rata mensile: \u20ac{m.get('rata_mensile', 0):,.2f}",
            f"  Totale interessi pagati: \u20ac{m.get('totale_interessi', 0):,.0f}",
            f"  COSTO TOTALE MUTUO (interessi + spese): \u20ac{m.get('costo_totale', 0):,.0f}",
            f"  LTV: {m.get('ltv', 0):.1f}%",
        ])
        spese_parts = []
        if m.get('spese_istruttoria'):
            spese_parts.append(f"istruttoria \u20ac{m['spese_istruttoria']:,.0f}")
        if m.get('spese_perizia'):
            spese_parts.append(f"perizia \u20ac{m['spese_perizia']:,.0f}")
        if m.get('costo_assicurazione'):
            spese_parts.append(f"assicurazione \u20ac{m['costo_assicurazione']:,.0f}")
        if m.get('spese_notarili'):
            spese_parts.append(f"notarili \u20ac{m['spese_notarili']:,.0f}")
        if m.get('altre_spese'):
            spese_parts.append(f"altre \u20ac{m['altre_spese']:,.0f}")
        if spese_parts:
            lines.append(f"  Spese accessorie: {', '.join(spese_parts)}")
        else:
            lines.append(f"  Spese accessorie: nessuna")
        if m.get('note'):
            note_short = m['note'][:150].replace('\n', ' ').strip()
            if len(m['note']) > 150:
                note_short += '...'
            lines.append(f"  Note: {note_short}")
        mutui_desc.append("\n".join(lines))

    mutui_block = "\n\n".join(mutui_desc)

    # Calcola classifica esplicita per il modello
    migliore = mutui_sorted[0]
    classifica_text = "CLASSIFICA PER COSTO TOTALE (dal pi\u00f9 conveniente al pi\u00f9 caro):\n"
    for i, m in enumerate(mutui_sorted, 1):
        diff = (m.get('costo_totale', 0) or 0) - (migliore.get('costo_totale', 0) or 0)
        diff_text = f" (+\u20ac{diff:,.0f} rispetto al migliore)" if diff > 0 else " \u2190 IL PI\u00d9 CONVENIENTE"
        classifica_text += f"  {i}. {m['banca']}: \u20ac{m.get('costo_totale', 0):,.0f}{diff_text}\n"

    # Trova il mutuo con rata pi\u00f9 bassa e con spese iniziali pi\u00f9 basse
    min_rata = min(mutui_sorted, key=lambda m: m.get('rata_mensile', 0) or 0)
    spese_iniziali = lambda m: (m.get('spese_istruttoria', 0) + m.get('spese_perizia', 0) + m.get('spese_notarili', 0))
    min_spese = min(mutui_sorted, key=spese_iniziali)

    scenari_text = (
        f"\nSCENARI PRECALCOLATI:\n"
        f"- Se vuoi SPENDERE MENO in assoluto nel tempo \u2192 {migliore['banca']} (costo totale \u20ac{migliore.get('costo_totale', 0):,.0f})\n"
        f"- Se vuoi la RATA MENSILE PI\u00d9 BASSA \u2192 {min_rata['banca']} (rata \u20ac{min_rata.get('rata_mensile', 0):,.2f}/mese)\n"
        f"- Se hai POCA LIQUIDIT\u00c0 INIZIALE (spese da anticipare basse) \u2192 {min_spese['banca']} (spese iniziali \u20ac{spese_iniziali(min_spese):,.0f})\n"
    )

    prompt_parts = [
        "Sei un consulente finanziario italiano esperto di mutui.",
        f"Il cliente valuta {len(mutui_data)} offerte. I dati sono gi\u00e0 calcolati e verificati.",
        "",
        mutui_block,
        "",
        classifica_text,
        scenari_text,
        "",
        "REGOLE:",
        f"- Il mutuo col COSTO TOTALE pi\u00f9 basso \u00e8 {migliore['banca']} (\u20ac{migliore.get('costo_totale', 0):,.0f}).",
        "- Il COSTO TOTALE \u00e8 il dato pi\u00f9 importante: include interessi + spese.",
        "- Usa SOLO i numeri forniti. NON inventare dati. NON dire 'competitivo' senza spiegare rispetto a chi.",
        "- Per ogni pro/contro, cita il numero esatto e la differenza rispetto agli altri.",
        "",
        "STRUTTURA la risposta cos\u00ec:",
        "",
        "## 1. Classifica",
        "Ordina i mutui dal migliore al peggiore per costo totale. Per ognuno indica la differenza in \u20ac rispetto al primo.",
        "",
        "## 2. Quale scegliere in base alla tua situazione",
        f"- **Vuoi spendere meno in assoluto?** \u2192 {migliore['banca']}. Spiega perch\u00e9 con i numeri.",
        f"- **Hai bisogno della rata pi\u00f9 bassa?** \u2192 {min_rata['banca']}. Spiega la differenza di rata e quanto costa in pi\u00f9 nel totale.",
        f"- **Hai poca liquidit\u00e0 iniziale?** \u2192 {min_spese['banca']}. Spiega quanto risparmi sulle spese iniziali.",
        "- **Vuoi la massima sicurezza?** \u2192 Consiglia il fisso pi\u00f9 basso e spiega perch\u00e9.",
        "",
        "## 3. Da evitare",
        "Quali mutui sono chiaramente peggiori e perch\u00e9 (cita i numeri).",
        "",
        "## 4. Consigli pratici",
        "Suggerimenti concreti per negoziare con le banche (es. chiedere riduzione spese istruttoria, ecc.)",
    ]

    if domanda:
        prompt_parts.extend(["", f"## Domanda specifica del cliente:\n{domanda}\nRispondi a questa domanda in modo dettagliato."])

    prompt_parts.append("\nRispondi in italiano. Cita sempre i numeri esatti e le differenze in euro.")

    prompt = "\n".join(prompt_parts)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.4,
                        "top_p": 0.9,
                        "num_predict": 4096,
                        "num_ctx": 8192,
                    },
                },
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "Errore: nessuna risposta dal modello.")
    except httpx.ConnectError:
        return (
            "\u26a0\ufe0f Impossibile connettersi a Ollama. "
            "Assicurati che Ollama sia in esecuzione (ollama serve) "
            "e che il modello gemma2:2b sia installato (ollama pull gemma2:2b)."
        )
    except httpx.HTTPStatusError as e:
        return f"\u26a0\ufe0f Errore dal server Ollama: {e.response.status_code}"
    except Exception as e:
        return f"\u26a0\ufe0f Errore imprevisto: {str(e)}"


async def verifica_ollama() -> dict:
    """Verifica che Ollama sia raggiungibile e il modello disponibile."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            models = resp.json().get("models", [])
            model_names = [m["name"] for m in models]
            gemma_available = any(MODEL_NAME in name for name in model_names)
            return {
                "ollama_online": True,
                "modello_disponibile": gemma_available,
                "modello": MODEL_NAME,
                "modelli_installati": model_names,
            }
    except Exception:
        return {
            "ollama_online": False,
            "modello_disponibile": False,
            "modello": MODEL_NAME,
            "modelli_installati": [],
        }
