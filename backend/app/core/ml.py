from __future__ import annotations

from datetime import date

import joblib
import numpy as np
import pandas as pd

from app.config import settings

_pipeline = None
_class_labels: list[str] = []


def load_model() -> None:
    global _pipeline, _class_labels
    _pipeline = joblib.load(settings.model_path)
    # PyCaret stores the LabelEncoder on the label_encoding step; its classes_
    # give the string labels ('Aprovado', 'Negado') in the same order as predict_proba columns.
    try:
        le = _pipeline.named_steps["label_encoding"].transformer
        _class_labels = list(le.classes_)
    except Exception:
        _class_labels = ["Aprovado", "Negado"]


def _apply_feature_engineering(data: dict) -> pd.DataFrame:
    df = pd.DataFrame([data])
    income = float(df["PatientIncomeUSD"].iloc[0])
    claim = float(df["ClaimAmountUSD"].iloc[0])
    years = int(df["YearsAsInsured"].iloc[0])
    age = int(df["PatientAge"].iloc[0])

    df["ClaimToIncomeRatio"] = round(claim / max(income, 1), 4)
    df["IsLongTermInsured"] = int(years >= 8)
    df["IsNewInsured"] = int(years <= 2)
    df["IsHighValueClaim"] = int(claim > 8000)
    df["IsElderly"] = int(age > 60)
    return df


# Rules derived from ETL business logic (CLAUDE.md)
_FACTOR_RULES: list[tuple] = [
    ("ClaimType", "==", "Emergência",    "Sinistro de emergência — cobertura prioritária", True),
    ("ClaimType", "==", "Internação",    "Internação hospitalar coberta pelo plano", True),
    ("YearsAsInsured", ">=", 15,         "Beneficiário de longa data (≥15 anos)", True),
    ("YearsAsInsured", ">=", 8,          "Beneficiário fidelizado (≥8 anos)", True),
    ("PlanType", "==", "Empresarial",    "Plano empresarial com ampla cobertura", True),
    ("ClaimToIncomeRatio", "<", 0.02,    "Valor do sinistro baixo em relação à renda", True),
    ("ClaimSubmissionMethod", "==", "Online", "Submissão digital reduz risco de erros", True),
    ("ProviderSpecialty", "==", "Pediatria", "Especialidade pediátrica bem coberta", True),
    ("ClaimType", "==", "Ambulatorial",  "Sinistro ambulatorial requer análise adicional", False),
    ("YearsAsInsured", "<=", 2,          "Beneficiário recente (≤2 anos) — histórico limitado", False),
    ("HasChronicCondition", "==", True,  "Condição crônica aumenta escrutínio da operadora", False),
    ("ClaimToIncomeRatio", ">", 0.20,    "Valor elevado em relação à renda — requer auditoria", False),
    ("PlanType", "==", "MEI",            "Plano MEI com cobertura mais restrita", False),
    ("PatientAge", ">", 70,              "Paciente idoso — maior custo esperado", False),
    ("ProviderSpecialty", "==", "Ortopedia", "Ortopedia — frequente em procedimentos eletivos", False),
]


def _eval_condition(value, op: str, threshold) -> bool:
    if op == "==":
        return value == threshold
    if op == ">=":
        return float(value) >= float(threshold)
    if op == "<=":
        return float(value) <= float(threshold)
    if op == ">":
        return float(value) > float(threshold)
    if op == "<":
        return float(value) < float(threshold)
    return False


def _generate_factors(data: dict, claim_to_income_ratio: float) -> dict:
    enriched = {**data, "ClaimToIncomeRatio": claim_to_income_ratio}
    positive, attention = [], []
    for field, op, threshold, label, is_positive in _FACTOR_RULES:
        val = enriched.get(field)
        if val is None:
            continue
        if _eval_condition(val, op, threshold):
            (positive if is_positive else attention).append(label)
    return {"positive": positive, "attention": attention}


def predict(data: dict) -> dict:
    if _pipeline is None:
        raise RuntimeError("Model not loaded")

    df = _apply_feature_engineering(data)
    claim_to_income = float(df["ClaimToIncomeRatio"].iloc[0])

    status_raw = _pipeline.predict(df)
    # predict() may return a DataFrame/Series from PyCaret's label decoding
    status = status_raw.iloc[0] if hasattr(status_raw, "iloc") else status_raw[0]

    proba = _pipeline.predict_proba(df)[0]
    labels = _class_labels  # ['Aprovado', 'Negado'] from LabelEncoder

    proba_dict = {str(l): round(float(p), 4) for l, p in zip(labels, proba)}
    confidence = round(float(max(proba)) * 100, 1)
    factors = _generate_factors(data, claim_to_income)

    return {
        "status": str(status),
        "probability": proba_dict,
        "approved": str(status) == "Aprovado",
        "confidence": confidence,
        "factors": factors,
        "model": "ExtraTreesClassifier",
    }
