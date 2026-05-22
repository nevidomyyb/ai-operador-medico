import uuid
from datetime import date, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import settings
from app.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import (
    DecisionUpdate,
    PaginatedPredictions,
    PredictionCreate,
    PredictionListItem,
    PredictionResponse,
)
from app.services.prediction import run_prediction

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


def _calculate_age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_prediction(
    body: PredictionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    usd = settings.usd_to_brl
    patient_age = _calculate_age(body.birth_date)
    patient_data = {
        # Display fields
        "full_name":        body.full_name,
        "cpf":              body.cpf,
        "birth_date":       body.birth_date.isoformat(),
        "request_date":     body.request_date.isoformat() if body.request_date else None,
        "suggested_date":   body.suggested_date.isoformat() if body.suggested_date else None,
        "additional_notes": body.additional_notes,
        # Model fields
        "PatientAge":             patient_age,
        "PatientGender":          body.PatientGender,
        "PatientMaritalStatus":   body.PatientMaritalStatus,
        "PatientEmploymentStatus":body.PatientEmploymentStatus,
        "ChildrenCount":          body.ChildrenCount,
        "IsHomeOwner":            body.IsHomeOwner,
        "EducationLevel":         body.EducationLevel,
        "HasChronicCondition":    body.HasChronicCondition,
        "PlanType":               body.PlanType,
        "YearsAsInsured":         body.YearsAsInsured,
        "PatientIncomeUSD":       round((body.income_monthly_brl * 12) / usd, 2),
        "ClaimType":              body.ClaimType,
        "ClaimSubmissionMethod":  body.ClaimSubmissionMethod,
        "DiagnosisCode":          body.DiagnosisCode,
        "ProcedureCode":          body.ProcedureCode,
        "ClaimAmountUSD":         round(body.claim_amount_brl / usd, 2),
        "ProviderSpecialty":      body.ProviderSpecialty,
        "ProviderState":          body.ProviderState,
    }

    pred = Prediction(user_id=current_user.id, status="PROCESSING", patient_data=patient_data)
    db.add(pred)
    db.commit()
    db.refresh(pred)

    background_tasks.add_task(run_prediction, pred.id)
    return {"id": str(pred.id), "status": pred.status}


@router.get("", response_model=PaginatedPredictions)
def list_predictions(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Prediction)
    if status_filter:
        q = q.filter(Prediction.status == status_filter.upper())
    if date_from:
        q = q.filter(func.date(Prediction.created_at) >= date_from)
    if date_to:
        q = q.filter(func.date(Prediction.created_at) <= date_to)

    total = q.count()
    items = q.order_by(Prediction.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)

    return PaginatedPredictions(
        items=[PredictionListItem.model_validate(i) for i in items],
        total=total, page=page, per_page=per_page, pages=pages,
    )


@router.get("/{prediction_id}", response_model=PredictionResponse)
def get_prediction(prediction_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    pred = db.get(Prediction, prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return pred


@router.patch("/{prediction_id}/decision", response_model=PredictionResponse)
def update_decision(
    prediction_id: uuid.UUID,
    body: DecisionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pred = db.get(Prediction, prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    if pred.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Só é possível registrar decisão em avaliações concluídas")
    pred.decision = body.decision
    db.commit()
    db.refresh(pred)
    return pred


@router.delete("/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction(prediction_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    pred = db.get(Prediction, prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    db.delete(pred)
    db.commit()
