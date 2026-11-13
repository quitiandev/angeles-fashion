from pydantic import BaseModel, EmailStr, Field, field_validator


class ClienteCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    apellido: str = Field(min_length=2, max_length=50)
    documento_identidad: str = Field(min_length=5, max_length=20)
    telefono: str | None = Field(default=None, max_length=20)
    correo: EmailStr | None = None

    @field_validator("nombre", "apellido", "documento_identidad")
    @classmethod
    def limpiar_campos(cls, valor: str) -> str:
        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError("El campo no puede estar vacío")

        return valor

    @field_validator("telefono")
    @classmethod
    def limpiar_telefono(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        return valor.strip() or None
