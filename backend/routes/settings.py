from fastapi import APIRouter, Depends
from database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/eurirs")
async def get_eurirs(db=Depends(get_db)):
    cursor = await db.execute("SELECT value FROM settings WHERE key = 'eurirs_30y'")
    row = await cursor.fetchone()
    if row:
        return {"eurirs_30y": float(row["value"])}
    return {"eurirs_30y": None}


@router.put("/eurirs")
async def set_eurirs(data: dict, db=Depends(get_db)):
    value = data.get("eurirs_30y")
    if value is None or not isinstance(value, (int, float)):
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="eurirs_30y deve essere un numero")
    await db.execute(
        """INSERT INTO settings (key, value, updated_at)
           VALUES ('eurirs_30y', :val, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value=:val, updated_at=CURRENT_TIMESTAMP""",
        {"val": str(value)},
    )
    await db.commit()
    return {"eurirs_30y": value}
