from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from database import get_db
from mortgage_engine import confronta_mutui

router = APIRouter(prefix="/api/confronto", tags=["confronto"])


@router.post("/")
async def confronta(mutuo_ids: list[int], db=Depends(get_db)):
    if len(mutuo_ids) < 2:
        raise HTTPException(status_code=400, detail="Servono almeno 2 mutui per il confronto")

    placeholders = ",".join("?" for _ in mutuo_ids)
    cursor = await db.execute(
        f"SELECT * FROM mutui WHERE id IN ({placeholders})", mutuo_ids
    )
    rows = await cursor.fetchall()

    if len(rows) != len(mutuo_ids):
        raise HTTPException(status_code=404, detail="Uno o pi\u00f9 mutui non trovati")

    mutui = [dict(r) for r in rows]
    risultato = confronta_mutui(mutui)
    risultato["mutui"] = mutui
    return risultato
