import csv

from sqlalchemy.orm import Session

from app.config import settings
from app.models.diagnosis import Diagnosis
from app.models.procedure import Procedure


def seed_catalogs(db: Session) -> None:
    if db.query(Diagnosis).count() == 0:
        with open(settings.diagnoses_csv, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            db.bulk_save_objects([
                Diagnosis(code=r["DiagnosisCode"], name_ptbr=r["DiagnosisNamePTBR"], category=r["DiagnosisCategory"])
                for r in reader
            ])
        db.commit()

    if db.query(Procedure).count() == 0:
        with open(settings.procedures_csv, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            db.bulk_save_objects([
                Procedure(code=r["ProcedureCode"], name_ptbr=r["ProcedureNamePTBR"], category=r["ProcedureCategory"])
                for r in reader
            ])
        db.commit()
