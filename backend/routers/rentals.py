from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from core.dependencies import obtener_usuario_actual

from models.user import Usuarios
from models.client import Clientes
from models.garment import Prendas
from models.rental import Alquiler
from models.rental_detail import DetallesAlquiler

from schemas.rental import AlquilerCreate
from datetime import date
from decimal import Decimal

router = APIRouter(
    prefix="/alquileres",
    tags=["Alquileres"],
    dependencies=[Depends(obtener_usuario_actual)],
)


@router.post("/", status_code=201)
def crear_alquiler(
    datos: AlquilerCreate,
    db: Session = Depends(get_db),
    usuario: Usuarios = Depends(obtener_usuario_actual),
):
    cliente = db.get(Clientes, datos.cliente_id)

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if datos.fecha_inicio < date.today():
        raise HTTPException(
            status_code=422,
            detail="No se pueden registrar alquileres con fecha de inicio pasada",
        )

    prendas = db.scalars(
        select(Prendas)
        .where(Prendas.id.in_(datos.prendas_ids))
        .order_by(Prendas.id)
        .with_for_update()
    ).all()

    if len(prendas) != len(datos.prendas_ids):
        raise HTTPException(status_code=404, detail="Una o varias prendas no existen")

    for prenda in prendas:
        if prenda.estado in ("vendida", "mantenimiento", "no_disponible"):
            raise HTTPException(
                status_code=409, detail=f"La prenda {prenda.codigo} no puede alquilarse"
            )

        conflicto = db.scalar(
            select(DetallesAlquiler.id)
            .join(Alquiler, DetallesAlquiler.alquiler_id == Alquiler.id)
            .where(
                DetallesAlquiler.prenda_id == prenda.id,
                Alquiler.estado.in_(["activo", "reservado"]),
                Alquiler.fecha_inicio <= datos.fecha_fin,
                Alquiler.fecha_fin >= datos.fecha_inicio,
            )
            .limit(1)
        )

        if conflicto is not None:
            raise HTTPException(
                status_code=409,
                detail=f"La prenda {prenda.codigo} ya está reservada en esas fechas",
            )

    try:
        alquiler = Alquiler(
            cliente_id=datos.cliente_id,
            usuario_id=usuario.id,
            fecha_inicio=datos.fecha_inicio,
            fecha_fin=datos.fecha_fin,
            estado="reservado",
        )

        db.add(alquiler)
        db.flush()

        for prenda in prendas:
            db.add(
                DetallesAlquiler(
                    alquiler_id=alquiler.id,
                    prenda_id=prenda.id,
                    precio=prenda.precio_alquiler,
                )
            )

        db.commit()
        db.refresh(alquiler)

    except Exception:
        db.rollback()
        raise

    return {
        "mensaje": "Alquiler registrado correctamente",
        "alquiler_id": alquiler.id,
        "estado": alquiler.estado,
        "prendas": [prenda.codigo for prenda in prendas],
    }


@router.get("/")
def listar_alquileres(db: Session = Depends(get_db)):
    alquileres = db.scalars(select(Alquiler).order_by(Alquiler.fecha.desc())).all()

    return alquileres


@router.get("/{alquiler_id}")
def obtener_alquiler(alquiler_id: int, db: Session = Depends(get_db)):
    alquiler = db.get(Alquiler, alquiler_id)

    if alquiler is None:
        raise HTTPException(status_code=404, detail="Alquiler no encontrado")

    detalles = db.scalars(
        select(DetallesAlquiler).where(DetallesAlquiler.alquiler_id == alquiler_id)
    ).all()

    prendas = db.scalars(
        select(Prendas).where(
            Prendas.id.in_([detalle.prenda_id for detalle in detalles])
        )
    ).all()

    prendas_por_id = {prenda.id: prenda for prenda in prendas}

    total = sum((detalle.precio for detalle in detalles), start=Decimal("0.00"))

    return {
        "alquiler_id": alquiler.id,
        "cliente_id": alquiler.cliente_id,
        "usuario_id": alquiler.usuario_id,
        "fecha_inicio": alquiler.fecha_inicio,
        "fecha_fin": alquiler.fecha_fin,
        "fecha_devolucion": alquiler.fecha_devolucion,
        "estado": alquiler.estado,
        "total": total,
        "detalles": [
            {
                "prenda_id": detalle.prenda_id,
                "codigo": prendas_por_id[detalle.prenda_id].codigo,
                "nombre": prendas_por_id[detalle.prenda_id].nombre,
                "precio": detalle.precio,
            }
            for detalle in detalles
        ],
    }


@router.patch("/{alquiler_id}/activar")
def activar_alquiler(alquiler_id: int, db: Session = Depends(get_db)):
    alquiler = db.scalar(
        select(Alquiler).where(Alquiler.id == alquiler_id).with_for_update()
    )

    if alquiler is None:
        raise HTTPException(status_code=404, detail="Alquiler no encontrado")

    if alquiler.estado != "reservado":
        raise HTTPException(
            status_code=409, detail="Solo se pueden activar alquileres reservados"
        )

    hoy = date.today()

    if not (alquiler.fecha_inicio <= hoy <= alquiler.fecha_fin):
        raise HTTPException(
            status_code=409, detail="El alquiler está fuera de sus fechas programadas"
        )

    detalles = db.scalars(
        select(DetallesAlquiler).where(DetallesAlquiler.alquiler_id == alquiler_id)
    ).all()

    prendas = db.scalars(
        select(Prendas)
        .where(Prendas.id.in_([detalle.prenda_id for detalle in detalles]))
        .order_by(Prendas.id)
        .with_for_update()
    ).all()

    if len(prendas) != len(detalles):
        raise HTTPException(
            status_code=409, detail="No se encontraron todas las prendas del alquiler"
        )

    for prenda in prendas:
        if prenda.estado != "disponible":
            raise HTTPException(
                status_code=409,
                detail=f"La prenda {prenda.codigo} no está disponible para entrega",
            )

    try:
        alquiler.estado = "activo"

        for prenda in prendas:
            prenda.estado = "alquilada"

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "mensaje": "Alquiler activado correctamente",
        "alquiler_id": alquiler.id,
        "estado": alquiler.estado,
    }


@router.patch("/{alquiler_id}/devolver")
def devolver_alquiler(alquiler_id: int, db: Session = Depends(get_db)):
    alquiler = db.scalar(
        select(Alquiler).where(Alquiler.id == alquiler_id).with_for_update()
    )

    if alquiler is None:
        raise HTTPException(status_code=404, detail="Alquiler no encontrado")

    if alquiler.estado != "activo":
        raise HTTPException(
            status_code=409, detail="Solo se pueden devolver alquileres activos"
        )

    detalles = db.scalars(
        select(DetallesAlquiler).where(DetallesAlquiler.alquiler_id == alquiler_id)
    ).all()

    prendas = db.scalars(
        select(Prendas)
        .where(Prendas.id.in_([detalle.prenda_id for detalle in detalles]))
        .order_by(Prendas.id)
        .with_for_update()
    ).all()

    if len(prendas) != len(detalles):
        raise HTTPException(
            status_code=409, detail="No se encontraron todas las prendas del alquiler"
        )

    for prenda in prendas:
        if prenda.estado != "alquilada":
            raise HTTPException(
                status_code=409,
                detail=f"La prenda {prenda.codigo} no figura como alquilada",
            )

    try:
        alquiler.estado = "devuelto"
        alquiler.fecha_devolucion = date.today()

        for prenda in prendas:
            prenda.estado = "disponible"

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "mensaje": "Alquiler devuelto correctamente",
        "alquiler_id": alquiler.id,
        "estado": alquiler.estado,
        "fecha_devolucion": alquiler.fecha_devolucion,
    }


@router.patch("/{alquiler_id}/cancelar")
def cancelar_alquiler(alquiler_id: int, db: Session = Depends(get_db)):
    alquiler = db.scalar(
        select(Alquiler).where(Alquiler.id == alquiler_id).with_for_update()
    )

    if alquiler is None:
        raise HTTPException(status_code=404, detail="Alquiler no encontrado")

    if alquiler.estado != "reservado":
        raise HTTPException(
            status_code=409, detail="Solo se pueden cancelar alquileres reservados"
        )

    try:
        alquiler.estado = "cancelado"
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "mensaje": "Alquiler cancelado correctamente",
        "alquiler_id": alquiler.id,
        "estado": alquiler.estado,
    }
