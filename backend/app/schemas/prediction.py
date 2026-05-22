import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class PredictionCreate(BaseModel):
    # Display-only fields (stored but not sent to model)
    full_name: str
    cpf: str
    birth_date: date
    request_date: date | None = None
    suggested_date: date | None = None
    additional_notes: str | None = None

    # Patient fields → model
    PatientGender: Literal["Masculino", "Feminino"]
    PatientMaritalStatus: Literal["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"]
    PatientEmploymentStatus: Literal["Empregado", "Desempregado", "Aposentado", "Estudante"]
    ChildrenCount: int = Field(ge=0, le=5)
    IsHomeOwner: bool
    EducationLevel: Literal["Fundamental", "Médio", "Superior", "Pós-graduação"]
    HasChronicCondition: bool

    # Plan & history → model
    PlanType: Literal["Individual", "Familiar", "Empresarial", "MEI"]
    YearsAsInsured: int = Field(ge=1, le=81)

    # Income (collected in BRL/month, converted to USD/year by backend)
    income_monthly_brl: float = Field(gt=0)

    # Claim → model
    ClaimType: Literal["Emergência", "Internação", "Consulta de Rotina", "Ambulatorial"]
    ClaimSubmissionMethod: Literal["Online", "Telefone", "Papel/Correio"]
    DiagnosisCode: str
    ProcedureCode: str
    claim_amount_brl: float = Field(gt=0, description="Valor do sinistro em BRL")

    # Provider → model
    ProviderSpecialty: Literal["Cardiologia", "Clínica Geral", "Neurologia", "Ortopedia", "Pediatria"]
    ProviderState: str = Field(min_length=2, max_length=2)


class DecisionUpdate(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "REVIEW"]


class PredictionResponse(BaseModel):
    id: uuid.UUID
    status: str
    decision: str | None
    patient_data: dict
    result: dict | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PredictionListItem(BaseModel):
    id: uuid.UUID
    status: str
    decision: str | None
    patient_data: dict
    result: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedPredictions(BaseModel):
    items: list[PredictionListItem]
    total: int
    page: int
    per_page: int
    pages: int
