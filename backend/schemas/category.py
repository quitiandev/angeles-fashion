from pydantic import BaseModel


class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
