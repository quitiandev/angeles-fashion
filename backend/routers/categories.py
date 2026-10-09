from fastapi import APIRouter, Depends
from schemas.category import CategoriaCreate
from sqlalchemy.orm import Session
from database import get_db
from models import Categorias

router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"],
)


@router.get("/")
def listar_categorias(db: Session = Depends(get_db)):
    categorias = db.query(Categorias).all()
    return categorias


@router.post("/")
def crear_categoria(categoria: CategoriaCreate, db: Session = Depends(get_db)):
    nueva_categoria = Categorias(
        nombre=categoria.nombre, descripcion=categoria.descripcion
    )
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return nueva_categoria


@router.get("/{categoria_id}")
def obtener_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categorias).filter(Categorias.id == categoria_id).first()

    return categoria


@router.put("/{categoria_id}")
def actualizar_categoria(
    categoria_id: int, datos: CategoriaCreate, db: Session = Depends(get_db)
):
    categoria = db.query(Categorias).filter(Categorias.id == categoria_id).first()

    if categoria is None:
        return {"mensaje": "Categoría no encontrada"}

    categoria.nombre = datos.nombre
    categoria.descripcion = datos.descripcion

    db.commit()
    db.refresh(categoria)

    return categoria


@router.delete("/{categoria_id}")
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categorias).filter(Categorias.id == categoria_id).first()
    if categoria is None:
        return {"mensaje": "Categoría no encontrada"}

    db.delete(categoria)
    db.commit()

    return {"mensaje": "Se eliminó la categoria"}
