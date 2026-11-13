from pydantic import BaseModel, Field, field_validator


class VentaCreate(BaseModel):
    cliente_id: int = Field(gt=0)
    prendas_ids: list[int] = Field(min_length=1)

    @field_validator("prendas_ids")
    @classmethod
    def validar_prendas(cls, valores: list[int]) -> list[int]:
        if any(prenda_id <= 0 for prenda_id in valores):
            raise ValueError("Los identificadores de prendas deben ser positivos")

        if len(valores) != len(set(valores)):
            raise ValueError("No se puede incluir la misma prenda dos veces")

        return valores
