from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Clientes(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    documento_identidad: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    telefono: Mapped[str] = mapped_column(String(20), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
