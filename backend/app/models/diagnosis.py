from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    code: Mapped[str] = mapped_column(String(20), primary_key=True)
    name_ptbr: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
