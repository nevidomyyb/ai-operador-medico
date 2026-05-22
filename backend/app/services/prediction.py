import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.core.ml import predict
from app.database import SessionLocal
from app.models.prediction import Prediction


def _calculate_age(birth_date: date) -> int:
    from datetime import date as d
    today = d.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def run_prediction(prediction_id: uuid.UUID) -> None:
    db: Session = SessionLocal()
    try:
        pred = db.get(Prediction, prediction_id)
        if pred is None:
            return

        data = pred.patient_data
        usd_to_brl = 5.75

        model_input = {
            "PatientAge":             data["PatientAge"],
            "PatientGender":          data["PatientGender"],
            "PatientMaritalStatus":   data["PatientMaritalStatus"],
            "PatientEmploymentStatus":data["PatientEmploymentStatus"],
            "ChildrenCount":          data["ChildrenCount"],
            "IsHomeOwner":            int(data["IsHomeOwner"]),
            "EducationLevel":         data["EducationLevel"],
            "HasChronicCondition":    int(data["HasChronicCondition"]),
            "PlanType":               data["PlanType"],
            "YearsAsInsured":         data["YearsAsInsured"],
            "PatientIncomeUSD":       data["PatientIncomeUSD"],
            "ClaimType":              data["ClaimType"],
            "ClaimSubmissionMethod":  data["ClaimSubmissionMethod"],
            "DiagnosisCode":          data["DiagnosisCode"],
            "ProcedureCode":          data["ProcedureCode"],
            "ClaimAmountUSD":         data["ClaimAmountUSD"],
            "ProviderSpecialty":      data["ProviderSpecialty"],
            "ProviderState":          data["ProviderState"],
        }

        result = predict(model_input)
        pred.result = result
        pred.status = "COMPLETED"
    except Exception as exc:
        if pred:
            pred.status = "FAILED"
            pred.error_message = str(exc)
    finally:
        db.commit()
        db.close()
