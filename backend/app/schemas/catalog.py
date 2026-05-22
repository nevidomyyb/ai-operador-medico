from pydantic import BaseModel


class DiagnosisResponse(BaseModel):
    code: str
    name_ptbr: str
    category: str

    model_config = {"from_attributes": True}


class ProcedureResponse(BaseModel):
    code: str
    name_ptbr: str
    category: str

    model_config = {"from_attributes": True}


class PaginatedCatalog(BaseModel):
    items: list[DiagnosisResponse | ProcedureResponse]
    total: int
    page: int
    per_page: int
    pages: int
