import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.diagnosis import Diagnosis
from app.models.procedure import Procedure
from app.schemas.catalog import DiagnosisResponse, PaginatedCatalog, ProcedureResponse

router = APIRouter(prefix="/api/catalogs", tags=["catalogs"])


@router.get("/diagnoses")
def list_diagnoses(
    search: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Diagnosis)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(Diagnosis.code.ilike(term), Diagnosis.name_ptbr.ilike(term)))
    if category:
        q = q.filter(Diagnosis.category == category)
    total = q.count()
    items = q.order_by(Diagnosis.code).offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedCatalog(
        items=[DiagnosisResponse.model_validate(i) for i in items],
        total=total, page=page, per_page=per_page,
        pages=max(1, math.ceil(total / per_page)),
    )


@router.get("/diagnoses/categories")
def list_diagnosis_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(Diagnosis.category).distinct().order_by(Diagnosis.category).all()
    return [r[0] for r in rows]


@router.get("/procedures")
def list_procedures(
    search: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Procedure)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(Procedure.code.ilike(term), Procedure.name_ptbr.ilike(term)))
    if category:
        q = q.filter(Procedure.category == category)
    total = q.count()
    items = q.order_by(Procedure.code).offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedCatalog(
        items=[ProcedureResponse.model_validate(i) for i in items],
        total=total, page=page, per_page=per_page,
        pages=max(1, math.ceil(total / per_page)),
    )


@router.get("/procedures/categories")
def list_procedure_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(Procedure.category).distinct().order_by(Procedure.category).all()
    return [r[0] for r in rows]
