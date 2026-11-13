from datetime import date
from pydantic import BaseModel, Field, model_validator


class AlquilerCreate(BaseModel):
    cliente_id: int = Field(gt=0)
    prendas_id: list[int] = Field(min_length=1)

    fecha_inicio: date
    fecha_fin: date


from datetime import date

from pydantic import BaseModel, Field, model_validator


class AlquilerCreate(BaseModel):
    cliente_id: int = Field(gt=0)
    prendas_ids: list[int] = Field(min_length=1)

    fecha_inicio: date
    fecha_fin: date

    @model_validator(mode="after")
    def validar_alquiler(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError(
                "La fecha de finalización no puede ser " "anterior a la fecha de inicio"
            )

        if any(prenda_id <= 0 for prenda_id in self.prendas_ids):
            raise ValueError("Los identificadores de prendas deben ser positivos")

        if len(self.prendas_ids) != len(set(self.prendas_ids)):
            raise ValueError(
                "No se puede alquilar la misma prenda " "dos veces en una operación"
            )

        return self
