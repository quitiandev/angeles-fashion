from pydantic import BaseModel, Field, field_validator


class CategoriaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        nombre_limpio = valor.strip()

        if len(nombre_limpio) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")

        return nombre_limpio
