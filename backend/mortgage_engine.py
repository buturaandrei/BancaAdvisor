MESI_ANNO = 12


def calcola_rata_mensile(importo: float, tan: float, durata_anni: int) -> float:
    """Calcola la rata mensile con formula francese (ammortamento alla francese)."""
    if tan == 0:
        return importo / (durata_anni * MESI_ANNO)

    tasso_mensile = (tan / 100) / MESI_ANNO
    num_rate = durata_anni * MESI_ANNO
    rata = (importo * tasso_mensile * pow(1 + tasso_mensile, num_rate)) / (
        pow(1 + tasso_mensile, num_rate) - 1
    )
    return round(rata, 2)


def calcola_piano_ammortamento(
    importo: float, tan: float, durata_anni: int
) -> list[dict]:
    """Genera il piano di ammortamento completo."""
    tasso_mensile = (tan / 100) / MESI_ANNO
    num_rate = durata_anni * MESI_ANNO
    rata = calcola_rata_mensile(importo, tan, durata_anni)
    debito_residuo = importo
    piano = []

    for mese in range(1, num_rate + 1):
        quota_interessi = round(debito_residuo * tasso_mensile, 2)
        quota_capitale = round(rata - quota_interessi, 2)
        debito_residuo = round(debito_residuo - quota_capitale, 2)

        if debito_residuo < 0:
            debito_residuo = 0

        piano.append(
            {
                "mese": mese,
                "rata": rata,
                "quota_capitale": quota_capitale,
                "quota_interessi": quota_interessi,
                "debito_residuo": debito_residuo,
            }
        )

    return piano


def calcola_totale_interessi(importo: float, tan: float, durata_anni: int) -> float:
    """Calcola il totale interessi pagati sull'intera durata del mutuo."""
    rata = calcola_rata_mensile(importo, tan, durata_anni)
    num_rate = durata_anni * MESI_ANNO
    return round(rata * num_rate - importo, 2)


def calcola_costo_totale(
    importo: float,
    tan: float,
    durata_anni: int,
    spese_istruttoria: float = 0,
    spese_perizia: float = 0,
    costo_assicurazione: float = 0,
    spese_notarili: float = 0,
    altre_spese: float = 0,
) -> float:
    """Calcola il costo totale del mutuo (interessi + tutte le spese)."""
    totale_interessi = calcola_totale_interessi(importo, tan, durata_anni)
    spese_totali = (
        spese_istruttoria
        + spese_perizia
        + costo_assicurazione
        + spese_notarili
        + altre_spese
    )
    return round(totale_interessi + spese_totali, 2)


def calcola_ltv(importo: float, valore_immobile: float) -> float:
    """Calcola il Loan-to-Value ratio in percentuale."""
    if valore_immobile <= 0:
        return 0
    return round((importo / valore_immobile) * 100, 2)


def calcola_punteggio(mutuo: dict) -> float:
    """
    Calcola un punteggio di convenienza per il mutuo (0-100, pi\u00f9 alto = pi\u00f9 conveniente).

    Criteri pesati:
    - Rapporto interessi/importo (35%): cattura il vero costo finanziario
    - TAN (25%): tasso nominale
    - TAEG (20%): tasso effettivo (include spread e spese periodiche)
    - LTV (10%): rischio loan-to-value
    - Spese accessorie (10%): rapporto spese/importo
    """
    punteggio = 100.0

    # Penalit\u00e0 per rapporto interessi/importo (il fattore pi\u00f9 importante)
    importo = mutuo.get("importo", 1)
    totale_interessi = mutuo.get("totale_interessi", 0) or 0
    rapporto_interessi = (totale_interessi / importo) * 100 if importo > 0 else 0
    # Un rapporto del 60% (es. 108k interessi su 180k) toglie ~30 punti
    punteggio -= rapporto_interessi * 0.5

    # Penalit\u00e0 TAN
    tan = mutuo.get("tan", 0)
    punteggio -= tan * 5

    # Penalit\u00e0 TAEG (solo la parte che eccede il TAN)
    taeg = mutuo.get("taeg") or tan
    if taeg > tan:
        punteggio -= (taeg - tan) * 4

    # Penalit\u00e0 LTV sopra 80%
    ltv = mutuo.get("ltv", 80)
    if ltv > 80:
        punteggio -= (ltv - 80) * 1.0

    # Penalit\u00e0 spese accessorie
    spese = (
        mutuo.get("spese_istruttoria", 0)
        + mutuo.get("spese_perizia", 0)
        + mutuo.get("costo_assicurazione", 0)
        + mutuo.get("spese_notarili", 0)
        + mutuo.get("altre_spese", 0)
    )
    rapporto_spese = (spese / importo) * 100 if importo > 0 else 0
    punteggio -= rapporto_spese * 2

    return round(max(0, min(100, punteggio)), 1)


def confronta_mutui(mutui: list[dict]) -> dict:
    """
    Confronta una lista di mutui e genera classifica e analisi.

    Returns:
        dict con classifica, migliore_id e analisi testuale
    """
    if not mutui:
        return {"classifica": [], "migliore_id": 0, "analisi": "Nessun mutuo da confrontare."}

    classifica = []
    for m in mutui:
        punteggio = calcola_punteggio(m)
        classifica.append(
            {
                "id": m["id"],
                "banca": m["banca"],
                "punteggio": punteggio,
                "rata_mensile": m.get("rata_mensile", 0),
                "costo_totale": m.get("costo_totale", 0),
                "tan": m.get("tan", 0),
                "taeg": m.get("taeg"),
            }
        )

    classifica.sort(key=lambda x: x["punteggio"], reverse=True)
    migliore = classifica[0]

    analisi_parts = [f"Analisi comparativa di {len(mutui)} mutui:\n"]
    for i, c in enumerate(classifica, 1):
        analisi_parts.append(
            f"{i}. {c['banca']} \u2014 Punteggio: {c['punteggio']}/100 | "
            f"Rata: \u20ac{c['rata_mensile']:,.2f} | "
            f"Costo totale: \u20ac{c['costo_totale']:,.2f} | "
            f"TAN: {c['tan']}%"
        )

    analisi_parts.append(
        f"\n\u2192 Il mutuo pi\u00f9 conveniente \u00e8 quello di {migliore['banca']} "
        f"con un punteggio di {migliore['punteggio']}/100."
    )

    if len(classifica) > 1:
        peggiore = classifica[-1]
        diff_rata = peggiore["rata_mensile"] - migliore["rata_mensile"]
        diff_totale = peggiore["costo_totale"] - migliore["costo_totale"]
        analisi_parts.append(
            f"Rispetto a {peggiore['banca']}, risparmi \u20ac{diff_rata:,.2f}/mese "
            f"e \u20ac{diff_totale:,.2f} sul totale."
        )

    return {
        "classifica": classifica,
        "migliore_id": migliore["id"],
        "analisi": "\n".join(analisi_parts),
    }
