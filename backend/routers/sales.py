from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from core.dependencies import obtener_usuario_actual
from models.user import Usuarios
from models.client import Clientes
from models.garment import Prendas
from models.sale import Ventas
from models.sale_detail import DetallesVenta
from schemas.sale import VentaCreate
from decimal import Decimal

from models.rental import Alquiler
from models.rental_detail import DetallesAlquiler

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.post("/", status_code=201)
def crear_venta(
    datos: VentaCreate,
    db: Session = Depends(get_db),
    usuario: Usuarios = Depends(obtener_usuario_actual),
):
    cliente = db.get(Clientes, datos.cliente_id)

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    prendas = db.scalars(
        select(Prendas)
        .where(Prendas.id.in_(datos.prendas_ids))
        .order_by(Prendas.id)
        .with_for_update()
    ).all()

    if len(prendas) != len(datos.prendas_ids):
        raise HTTPException(status_code=404, detail="Una o varias prendas no existen")

    for prenda in prendas:
        if prenda.estado != "disponible":
            raise HTTPException(
                status_code=409, detail=f"La prenda {prenda.codigo} no está disponible"
            )

    reserva_pendiente = db.scalar(
        select(DetallesAlquiler.id)
        .join(Alquiler, DetallesAlquiler.alquiler_id == Alquiler.id)
        .where(
            DetallesAlquiler.prenda_id == prenda.id,
            Alquiler.estado.in_(["reservado", "activo"]),
        )
        .limit(1)
    )

    if reserva_pendiente is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"La prenda {prenda.codigo} tiene " "un alquiler pendiente o activo"
            ),
        )

    try:
        venta = Ventas(cliente_id=datos.cliente_id, usuario_id=usuario.id)

        db.add(venta)
        db.flush()

        total = 0

        for prenda in prendas:
            detalle = DetallesVenta(
                venta_id=venta.id, prenda_id=prenda.id, precio=prenda.precio_venta
            )

            db.add(detalle)
            prenda.estado = "vendida"
            total += prenda.precio_venta

        db.commit()
        db.refresh(venta)

    except Exception:
        db.rollback()
        raise

    return {
        "mensaje": "Venta registrada correctamente",
        "venta_id": venta.id,
        "total": total,
        "prendas": [prenda.codigo for prenda in prendas],
    }


@router.get("/")
def listar_ventas(
    db: Session = Depends(get_db), usuario: Usuarios = Depends(obtener_usuario_actual)
):
    ventas = db.scalars(select(Ventas).order_by(Ventas.fecha.desc())).all()

    resultado = []

    for venta in ventas:
        detalles = db.scalars(
            select(DetallesVenta).where(DetallesVenta.venta_id == venta.id)
        ).all()

        total = sum(detalle.precio for detalle in detalles)

        resultado.append(
            {
                "id": venta.id,
                "cliente_id": venta.cliente_id,
                "usuario_id": venta.usuario_id,
                "fecha": venta.fecha,
                "total": float(total),
            }
        )

    return resultado


@router.get("/{venta_id}")
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuarios = Depends(obtener_usuario_actual),
):
    venta = db.get(Ventas, venta_id)

    if venta is None:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    detalles = db.scalars(
        select(DetallesVenta).where(DetallesVenta.venta_id == venta_id)
    ).all()

    prendas = db.scalars(
        select(Prendas).where(
            Prendas.id.in_([detalle.prenda_id for detalle in detalles])
        )
    ).all()

    prendas_por_id = {prenda.id: prenda for prenda in prendas}

    total = sum((detalle.precio for detalle in detalles), start=Decimal("0.00"))

    return {
        "venta_id": venta.id,
        "cliente_id": venta.cliente_id,
        "usuario_id": venta.usuario_id,
        "fecha": venta.fecha,
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
