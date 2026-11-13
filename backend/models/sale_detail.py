from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal
from models.base import Base


class DetallesVenta(Base):
    __tablename__ = "detalles_venta"

    id: Mapped[int] = mapped_column(primary_key=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("ventas.id"), nullable=False)
    prenda_id: Mapped[int] = mapped_column(ForeignKey("prendas.id"), nullable=False)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
