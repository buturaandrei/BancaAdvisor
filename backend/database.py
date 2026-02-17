import aiosqlite
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "bancadvisor.db"


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")

        await db.execute("""
            CREATE TABLE IF NOT EXISTS mutui (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                banca TEXT NOT NULL,
                tipo_tasso TEXT NOT NULL CHECK(tipo_tasso IN ('fisso','variabile','misto')),
                tan REAL NOT NULL,
                taeg REAL,
                spread REAL,
                importo REAL NOT NULL,
                valore_immobile REAL NOT NULL,
                durata_anni INTEGER NOT NULL,
                rata_mensile REAL,
                spese_istruttoria REAL DEFAULT 0,
                spese_perizia REAL DEFAULT 0,
                costo_assicurazione REAL DEFAULT 0,
                spese_notarili REAL DEFAULT 0,
                altre_spese REAL DEFAULT 0,
                note TEXT,
                ltv REAL,
                costo_totale REAL,
                totale_interessi REAL,
                punteggio REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS consulenze (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mutuo_ids TEXT NOT NULL,
                domanda TEXT NOT NULL,
                risposta TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.commit()
