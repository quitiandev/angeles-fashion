from datetime import datetime

from sqlalchemy import DateTime, String, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Prendas(Base):
    __tablename__ = "prendas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)

    categoria_id: Mapped[int] = mapped_column(
        ForeignKey("categorias.id"), nullable=False
    )

    talla: Mapped[str] = mapped_column(String(10), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)

    precio_venta: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_alquiler: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    estado: Mapped[str] = mapped_column(String(20), nullable=False)

    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
