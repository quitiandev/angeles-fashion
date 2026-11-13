from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.garment import Prendas
from models.category import Categorias
from schemas.garment import PrendaCreate
from core.dependencies import obtener_usuario_actual
from models.sale_detail import DetallesVenta
from models.rental_detail import DetallesAlquiler

from models.rental import Alquiler
from models.rental_detail import DetallesAlquiler

router = APIRouter(
    prefix="/prendas", tags=["Prendas"], dependencies=[Depends(obtener_usuario_actual)]
)


@router.post("/", status_code=201)
def crear_prenda(datos: PrendaCreate, db: Session = Depends(get_db)):
    categoria = db.get(Categorias, datos.categoria_id)

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    codigo = datos.codigo.strip().upper()

    existente = db.scalar(select(Prendas).where(Prendas.codigo == codigo))

    if existente:
        raise HTTPException(
            status_code=409, detail="Ya existe una prenda con ese código"
        )

    nueva_prenda = Prendas(
        codigo=codigo,
        nombre=datos.nombre,
        categoria_id=datos.categoria_id,
        talla=datos.talla,
        color=datos.color,
        precio_venta=datos.precio_venta,
        precio_alquiler=datos.precio_alquiler,
        estado=datos.estado,
        descripcion=datos.descripcion,
    )

    db.add(nueva_prenda)

    try:
        db.commit()
        db.refresh(nueva_prenda)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se pudo registrar la prenda por un conflicto de datos",
        )

    return {
        "mensaje": "Prenda registrada correctamente",
        "id": nueva_prenda.id,
        "codigo": nueva_prenda.codigo,
    }


@router.get("/")
def listar_prendas(db: Session = Depends(get_db)):
    prendas = db.scalars(select(Prendas).order_by(Prendas.id)).all()

    return prendas


@router.get("/{prenda_id}")
def obtener_prenda(prenda_id: int, db: Session = Depends(get_db)):
    prenda = db.get(Prendas, prenda_id)

    if prenda is None:
        raise HTTPException(status_code=404, detail="Prenda no encontrada")

    return prenda


@router.put("/{prenda_id}")
def actualizar_prenda(
    prenda_id: int, datos: PrendaCreate, db: Session = Depends(get_db)
):
    prenda = db.get(Prendas, prenda_id)

    if prenda is None:
        raise HTTPException(status_code=404, detail="Prenda no encontrada")

    if prenda.estado == "vendida":
        raise HTTPException(
            status_code=409, detail="No se puede modificar una prenda vendidas"
        )

    reserva_pendiente = db.scalar(
        select(DetallesAlquiler.id)
        .join(Alquiler, DetallesAlquiler.alquiler_id == Alquiler.id)
        .where(
            DetallesAlquiler.prenda_id == prenda_id,
            Alquiler.estado.in_(["reservado", "activo"]),
        )
        .limit(1)
    )

    if reserva_pendiente is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "No se puede modificar una prenda "
                "con alquileres pendientes o activos"
            ),
        )

    categoria = db.get(Categorias, datos.categoria_id)

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    codigo = datos.codigo.strip().upper()

    existente = db.scalar(
        select(Prendas).where(Prendas.codigo == codigo, Prendas.id != prenda_id)
    )

    if existente:
        raise HTTPException(
            status_code=409, detail="Ya existe otra prenda con ese código"
        )

    prenda.codigo = codigo
    prenda.nombre = datos.nombre
    prenda.categoria_id = datos.categoria_id
    prenda.talla = datos.talla
    prenda.color = datos.color
    prenda.precio_venta = datos.precio_venta
    prenda.precio_alquiler = datos.precio_alquiler
    prenda.estado = datos.estado
    prenda.descripcion = datos.descripcion

    try:
        db.commit()
        db.refresh(prenda)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se pudo actualizar la prenda por un conflicto de datos",
        )

    return prenda


@router.delete("/{prenda_id}", status_code=204)
def eliminar_prenda(prenda_id: int, db: Session = Depends(get_db)):
    prenda = db.get(Prendas, prenda_id)

    if prenda is None:
        raise HTTPException(status_code=404, detail="Prenda no encontrada")

    tiene_ventas = db.scalar(
        select(DetallesVenta.id).where(DetallesVenta.prenda_id == prenda_id).limit(1)
    )

    tiene_alquileres = db.scalar(
        select(DetallesAlquiler.id)
        .where(DetallesAlquiler.prenda_id == prenda_id)
        .limit(1)
    )

    if tiene_ventas is not None or tiene_alquileres is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar una prenda con ventas o alquileres registrados",
        )

    try:
        db.delete(prenda)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar la prenda porque tiene registros relacionados",
        )
