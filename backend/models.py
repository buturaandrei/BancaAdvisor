from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TipoTasso(str, Enum):
    FISSO = "fisso"
    VARIABILE = "variabile"
    MISTO = "misto"


class MutuoCreate(BaseModel):
    banca: str = Field(..., min_length=1, max_length=200)
    tipo_tasso: TipoTasso
    tan: float = Field(..., ge=0, le=100)
    taeg: Optional[float] = Field(None, ge=0, le=100)
    spread: Optional[float] = Field(None, ge=0, le=100)
    importo: float = Field(..., gt=0)
    valore_immobile: float = Field(..., gt=0)
    durata_anni: int = Field(..., ge=1, le=40)
    spese_istruttoria: float = Field(default=0, ge=0)
    spese_perizia: float = Field(default=0, ge=0)
    costo_assicurazione: float = Field(default=0, ge=0)
    spese_notarili: float = Field(default=0, ge=0)
    altre_spese: float = Field(default=0, ge=0)
    note: Optional[str] = Field(None, max_length=5000)


class MutuoUpdate(BaseModel):
    banca: Optional[str] = Field(None, min_length=1, max_length=200)
    tipo_tasso: Optional[TipoTasso] = None
    tan: Optional[float] = Field(None, ge=0, le=100)
    taeg: Optional[float] = Field(None, ge=0, le=100)
    spread: Optional[float] = Field(None, ge=0, le=100)
    importo: Optional[float] = Field(None, gt=0)
    valore_immobile: Optional[float] = Field(None, gt=0)
    durata_anni: Optional[int] = Field(None, ge=1, le=40)
    spese_istruttoria: Optional[float] = Field(None, ge=0)
    spese_perizia: Optional[float] = Field(None, ge=0)
    costo_assicurazione: Optional[float] = Field(None, ge=0)
    spese_notarili: Optional[float] = Field(None, ge=0)
    altre_spese: Optional[float] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=5000)


class MutuoResponse(BaseModel):
    id: int
    banca: str
    tipo_tasso: str
    tan: float
    taeg: Optional[float]
    spread: Optional[float]
    importo: float
    valore_immobile: float
    durata_anni: int
    rata_mensile: Optional[float]
    spese_istruttoria: float
    spese_perizia: float
    costo_assicurazione: float
    spese_notarili: float
    altre_spese: float
    note: Optional[str]
    ltv: Optional[float]
    costo_totale: Optional[float]
    totale_interessi: Optional[float]
    punteggio: Optional[float]
    created_at: str
    updated_at: str


class AdvisorRequest(BaseModel):
    mutuo_ids: list[int] = Field(..., min_length=1)
    domanda: Optional[str] = None


class AdvisorResponse(BaseModel):
    risposta: str
    mutuo_ids: list[int]


class AmortizationRow(BaseModel):
    mese: int
    rata: float
    quota_capitale: float
    quota_interessi: float
    debito_residuo: float


class ComparisonResult(BaseModel):
    mutui: list[MutuoResponse]
    classifica: list[dict]
    migliore_id: int
    analisi: str
