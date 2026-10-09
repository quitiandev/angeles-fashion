from sqlalchemy import Float, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class DetallesAlquiler(Base):
    __tablename__ = "detalles_alquiler"

    id: Mapped[int] = mapped_column(primary_key=True)
    alquiler_id: Mapped[int] = mapped_column(
        ForeignKey("alquileres.id"), nullable=False
    )
    prenda_id: Mapped[int] = mapped_column(ForeignKey("prendas.id"), nullable=False)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
