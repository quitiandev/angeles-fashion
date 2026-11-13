from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    correo: EmailStr
    contrasena: str = Field(min_length=8, max_length=128)


class UsuarioActualizar(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    correo: EmailStr


class UsuarioCambiarContrasena(BaseModel):
    contrasena: str = Field(min_length=8, max_length=128)


class UsuarioCambiarEstado(BaseModel):
    activo: bool


class UsuarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    correo: EmailStr
    activo: bool
    fecha_creacion: datetime
