from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class PrendaCreate(BaseModel):
    codigo: str = Field(min_length=2, max_length=20)
    nombre: str = Field(min_length=2, max_length=100)
    categoria_id: int = Field(gt=0)

    talla: str = Field(min_length=1, max_length=10)
    color: str = Field(min_length=2, max_length=20)

    precio_venta: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    precio_alquiler: Decimal = Field(ge=0, max_digits=10, decimal_places=2)

    estado: Literal[
        "disponible", "alquilada", "mantenimiento", "no_disponible", "vendida"
    ] = "disponible"

    descripcion: str | None = Field(default=None, max_length=255)

    @field_validator("codigo", "nombre", "talla", "color")
    @classmethod
    def limpiar_texto(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError("El campo no puede estar vacío")

        return valor
