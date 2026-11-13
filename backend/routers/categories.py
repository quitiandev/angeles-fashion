from fastapi import APIRouter, Depends, HTTPException
from schemas.category import CategoriaCreate
from sqlalchemy.orm import Session
from database import get_db
from models import Categorias
from sqlalchemy import func
from core.dependencies import obtener_usuario_actual

router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"],
    dependencies=[Depends(obtener_usuario_actual)],
)


@router.get("/")
def listar_categorias(db: Session = Depends(get_db)):
    categorias = db.query(Categorias).all()
    return categorias


@router.post("/")
def crear_categoria(categoria: CategoriaCreate, db: Session = Depends(get_db)):
    categoria_existente = (
        db.query(Categorias)
        .filter(func.lower(Categorias.nombre) == categoria.nombre.strip().lower())
        .first()
    )

    if categoria_existente is not None:
        raise HTTPException(
            status_code=409, detail="Ya existe una categoría con ese nombre"
        )

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

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")

    return categoria


@router.put("/{categoria_id}")
def actualizar_categoria(
    categoria_id: int, datos: CategoriaCreate, db: Session = Depends(get_db)
):
    categoria = db.query(Categorias).filter(Categorias.id == categoria_id).first()

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    nombre_limpio = datos.nombre.strip()

    categoria_existente = (
        db.query(Categorias)
        .filter(
            func.lower(Categorias.nombre) == nombre_limpio.lower(),
            Categorias.id != categoria_id,
        )
        .first()
    )

    if categoria_existente is not None:
        raise HTTPException(
            status_code=409, detail="Ya existe otra categoría con ese nombre"
        )

    categoria.nombre = nombre_limpio
    categoria.descripcion = datos.descripcion

    db.commit()
    db.refresh(categoria)

    return categoria


@router.delete("/{categoria_id}")
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categorias).filter(Categorias.id == categoria_id).first()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")

    db.delete(categoria)
    db.commit()

    return {"mensaje": "Se eliminó la categoria"}
