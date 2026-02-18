from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
import aiosqlite
import json
from models import MutuoCreate, MutuoUpdate, MutuoResponse
from database import get_db
from mortgage_engine import (
    calcola_rata_mensile,
    calcola_totale_interessi,
    calcola_costo_totale,
    calcola_ltv,
    calcola_punteggio,
    calcola_piano_ammortamento,
)

router = APIRouter(prefix="/api/mutui", tags=["mutui"])


def _row_to_dict(row: aiosqlite.Row) -> dict:
    return dict(row)


@router.post("/", response_model=MutuoResponse, status_code=201)
async def crea_mutuo(mutuo: MutuoCreate, db=Depends(get_db)):
    rata = calcola_rata_mensile(mutuo.importo, mutuo.tan, mutuo.durata_anni)
    ltv = calcola_ltv(mutuo.importo, mutuo.valore_immobile)
    totale_interessi = calcola_totale_interessi(mutuo.importo, mutuo.tan, mutuo.durata_anni)
    costo_totale = calcola_costo_totale(
        mutuo.importo, mutuo.tan, mutuo.durata_anni,
        mutuo.spese_istruttoria, mutuo.spese_perizia,
        mutuo.costo_assicurazione, mutuo.spese_notarili, mutuo.altre_spese,
    )

    data = mutuo.model_dump()
    data["rata_mensile"] = rata
    data["ltv"] = ltv
    data["totale_interessi"] = totale_interessi
    data["costo_totale"] = costo_totale
    data["punteggio"] = calcola_punteggio(data)

    cursor = await db.execute(
        """INSERT INTO mutui (
            banca, tipo_tasso, tan, taeg, spread, importo, valore_immobile,
            durata_anni, rata_mensile, spese_istruttoria, spese_perizia,
            costo_assicurazione, spese_notarili, altre_spese, note,
            ltv, costo_totale, totale_interessi, punteggio
        ) VALUES (
            :banca, :tipo_tasso, :tan, :taeg, :spread, :importo, :valore_immobile,
            :durata_anni, :rata_mensile, :spese_istruttoria, :spese_perizia,
            :costo_assicurazione, :spese_notarili, :altre_spese, :note,
            :ltv, :costo_totale, :totale_interessi, :punteggio
        )""",
        data,
    )
    await db.commit()
    mutuo_id = cursor.lastrowid

    row = await db.execute("SELECT * FROM mutui WHERE id = ?", (mutuo_id,))
    result = await row.fetchone()
    return dict(result)


@router.get("/", response_model=list[MutuoResponse])
async def lista_mutui(db=Depends(get_db)):
    cursor = await db.execute("SELECT * FROM mutui ORDER BY punteggio DESC")
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


@router.get("/export/all")
async def esporta_dati(db=Depends(get_db)):
    """Esporta tutti i mutui e le impostazioni come JSON."""
    cursor = await db.execute("SELECT * FROM mutui ORDER BY id")
    mutui = [dict(r) for r in await cursor.fetchall()]
    cursor = await db.execute("SELECT * FROM settings")
    settings = {r["key"]: r["value"] for r in await cursor.fetchall()}
    return JSONResponse({"mutui": mutui, "settings": settings})


@router.post("/import/all")
async def importa_dati(data: dict, db=Depends(get_db)):
    """Importa mutui e impostazioni da JSON esportato."""
    mutui = data.get("mutui", [])
    settings = data.get("settings", {})
    count = 0
    for m in mutui:
        m.pop("id", None)
        m.pop("created_at", None)
        m.pop("updated_at", None)
        cols = [k for k in m.keys()]
        placeholders = ", ".join(f":{k}" for k in cols)
        col_names = ", ".join(cols)
        await db.execute(f"INSERT INTO mutui ({col_names}) VALUES ({placeholders})", m)
        count += 1
    for key, value in settings.items():
        await db.execute(
            """INSERT INTO settings (key, value, updated_at)
               VALUES (:key, :val, CURRENT_TIMESTAMP)
               ON CONFLICT(key) DO UPDATE SET value=:val, updated_at=CURRENT_TIMESTAMP""",
            {"key": key, "val": value},
        )
    await db.commit()
    return {"importati": count}


@router.post("/ricalcola", status_code=200)
async def ricalcola_punteggi(db=Depends(get_db)):
    """Ricalcola rata, interessi, costo totale e punteggio per tutti i mutui."""
    cursor = await db.execute("SELECT * FROM mutui")
    rows = await cursor.fetchall()
    count = 0
    for row in rows:
        m = dict(row)
        m["rata_mensile"] = calcola_rata_mensile(m["importo"], m["tan"], m["durata_anni"])
        m["ltv"] = calcola_ltv(m["importo"], m["valore_immobile"])
        m["totale_interessi"] = calcola_totale_interessi(m["importo"], m["tan"], m["durata_anni"])
        m["costo_totale"] = calcola_costo_totale(
            m["importo"], m["tan"], m["durata_anni"],
            m["spese_istruttoria"], m["spese_perizia"],
            m["costo_assicurazione"], m["spese_notarili"], m["altre_spese"],
        )
        m["punteggio"] = calcola_punteggio(m)
        await db.execute(
            """UPDATE mutui SET rata_mensile=:rata_mensile, ltv=:ltv,
               totale_interessi=:totale_interessi, costo_totale=:costo_totale,
               punteggio=:punteggio WHERE id=:id""",
            m,
        )
        count += 1
    await db.commit()
    return {"ricalcolati": count}


@router.get("/{mutuo_id}", response_model=MutuoResponse)
async def dettaglio_mutuo(mutuo_id: int, db=Depends(get_db)):
    cursor = await db.execute("SELECT * FROM mutui WHERE id = ?", (mutuo_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Mutuo non trovato")
    return dict(row)


@router.put("/{mutuo_id}", response_model=MutuoResponse)
async def aggiorna_mutuo(mutuo_id: int, update: MutuoUpdate, db=Depends(get_db)):
    cursor = await db.execute("SELECT * FROM mutui WHERE id = ?", (mutuo_id,))
    existing = await cursor.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Mutuo non trovato")

    existing_dict = dict(existing)
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        existing_dict[key] = value

    existing_dict["rata_mensile"] = calcola_rata_mensile(
        existing_dict["importo"], existing_dict["tan"], existing_dict["durata_anni"]
    )
    existing_dict["ltv"] = calcola_ltv(existing_dict["importo"], existing_dict["valore_immobile"])
    existing_dict["totale_interessi"] = calcola_totale_interessi(
        existing_dict["importo"], existing_dict["tan"], existing_dict["durata_anni"]
    )
    existing_dict["costo_totale"] = calcola_costo_totale(
        existing_dict["importo"], existing_dict["tan"], existing_dict["durata_anni"],
        existing_dict["spese_istruttoria"], existing_dict["spese_perizia"],
        existing_dict["costo_assicurazione"], existing_dict["spese_notarili"],
        existing_dict["altre_spese"],
    )
    existing_dict["punteggio"] = calcola_punteggio(existing_dict)

    await db.execute(
        """UPDATE mutui SET
            banca=:banca, tipo_tasso=:tipo_tasso, tan=:tan, taeg=:taeg, spread=:spread,
            importo=:importo, valore_immobile=:valore_immobile, durata_anni=:durata_anni,
            rata_mensile=:rata_mensile, spese_istruttoria=:spese_istruttoria,
            spese_perizia=:spese_perizia, costo_assicurazione=:costo_assicurazione,
            spese_notarili=:spese_notarili, altre_spese=:altre_spese, note=:note,
            ltv=:ltv, costo_totale=:costo_totale, totale_interessi=:totale_interessi,
            punteggio=:punteggio, updated_at=CURRENT_TIMESTAMP
        WHERE id=:id""",
        existing_dict,
    )
    await db.commit()

    cursor = await db.execute("SELECT * FROM mutui WHERE id = ?", (mutuo_id,))
    result = await cursor.fetchone()
    return dict(result)


@router.delete("/{mutuo_id}", status_code=204)
async def elimina_mutuo(mutuo_id: int, db=Depends(get_db)):
    cursor = await db.execute("SELECT id FROM mutui WHERE id = ?", (mutuo_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Mutuo non trovato")
    await db.execute("DELETE FROM mutui WHERE id = ?", (mutuo_id,))
    await db.commit()


@router.patch("/{mutuo_id}/verificato")
async def toggle_verificato(mutuo_id: int, db=Depends(get_db)):
    cursor = await db.execute("SELECT verificato FROM mutui WHERE id = ?", (mutuo_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Mutuo non trovato")
    new_val = 0 if row["verificato"] else 1
    await db.execute("UPDATE mutui SET verificato = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_val, mutuo_id))
    await db.commit()
    return {"id": mutuo_id, "verificato": bool(new_val)}


@router.post("/ricalcola", status_code=200)
async def ricalcola_punteggi(db=Depends(get_db)):
    """Ricalcola rata, interessi, costo totale e punteggio per tutti i mutui."""
    cursor = await db.execute("SELECT * FROM mutui")
    rows = await cursor.fetchall()
    count = 0
    for row in rows:
        m = dict(row)
        m["rata_mensile"] = calcola_rata_mensile(m["importo"], m["tan"], m["durata_anni"])
        m["ltv"] = calcola_ltv(m["importo"], m["valore_immobile"])
        m["totale_interessi"] = calcola_totale_interessi(m["importo"], m["tan"], m["durata_anni"])
        m["costo_totale"] = calcola_costo_totale(
            m["importo"], m["tan"], m["durata_anni"],
            m["spese_istruttoria"], m["spese_perizia"],
            m["costo_assicurazione"], m["spese_notarili"], m["altre_spese"],
        )
        m["punteggio"] = calcola_punteggio(m)
        await db.execute(
            """UPDATE mutui SET rata_mensile=:rata_mensile, ltv=:ltv,
               totale_interessi=:totale_interessi, costo_totale=:costo_totale,
               punteggio=:punteggio WHERE id=:id""",
            m,
        )
        count += 1
    await db.commit()
    return {"ricalcolati": count}


@router.get("/{mutuo_id}/ammortamento")
async def piano_ammortamento(mutuo_id: int, db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT importo, tan, durata_anni FROM mutui WHERE id = ?", (mutuo_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Mutuo non trovato")
    data = dict(row)
    piano = calcola_piano_ammortamento(data["importo"], data["tan"], data["durata_anni"])
    return {"mutuo_id": mutuo_id, "piano": piano}
