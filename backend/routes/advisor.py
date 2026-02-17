from fastapi import APIRouter, Depends, HTTPException
import json
from database import get_db
from models import AdvisorRequest, AdvisorResponse
from ollama_advisor import chiedi_consulenza, verifica_ollama

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


@router.get("/status")
async def stato_advisor():
    return await verifica_ollama()


@router.post("/consulenza", response_model=AdvisorResponse)
async def richiedi_consulenza(request: AdvisorRequest, db=Depends(get_db)):
    placeholders = ",".join("?" for _ in request.mutuo_ids)
    cursor = await db.execute(
        f"SELECT * FROM mutui WHERE id IN ({placeholders})", request.mutuo_ids
    )
    rows = await cursor.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="Nessun mutuo trovato")

    mutui = [dict(r) for r in rows]
    risposta = await chiedi_consulenza(mutui, request.domanda)

    await db.execute(
        "INSERT INTO consulenze (mutuo_ids, domanda, risposta) VALUES (?, ?, ?)",
        (json.dumps(request.mutuo_ids), request.domanda or "", risposta),
    )
    await db.commit()

    return AdvisorResponse(risposta=risposta, mutuo_ids=request.mutuo_ids)


@router.get("/storico")
async def storico_consulenze(db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT * FROM consulenze ORDER BY created_at DESC LIMIT 50"
    )
    rows = await cursor.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["mutuo_ids"] = json.loads(d["mutuo_ids"])
        result.append(d)
    return result
