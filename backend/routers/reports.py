from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from database import get_db
from core.dependencies import obtener_usuario_actual
from models.garment import Prendas
from models.sale import Ventas
from models.sale_detail import DetallesVenta

from models.rental import Alquiler
from models.rental_detail import DetallesAlquiler

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"],
    dependencies=[Depends(obtener_usuario_actual)],
)


@router.get("/inventario")
def reporte_inventario(db: Session = Depends(get_db)):
    resultados = db.execute(
        select(Prendas.estado, func.count(Prendas.id)).group_by(Prendas.estado)
    ).all()

    return {
        "total_prendas": sum(cantidad for _, cantidad in resultados),
        "prendas_por_estado": {estado: cantidad for estado, cantidad in resultados},
    }


@router.get("/ventas")
def reporte_ventas(db: Session = Depends(get_db)):
    total_ventas = db.scalar(select(func.count(Ventas.id))) or 0

    total_prendas_vendidas = db.scalar(select(func.count(DetallesVenta.id))) or 0

    ingresos = db.scalar(select(func.sum(DetallesVenta.precio))) or 0

    return {
        "total_ventas": total_ventas,
        "prendas_vendidas": total_prendas_vendidas,
        "ingresos_totales": ingresos,
    }


@router.get("/alquileres")
def reporte_alquileres(db: Session = Depends(get_db)):
    resultados = db.execute(
        select(Alquiler.estado, func.count(Alquiler.id)).group_by(Alquiler.estado)
    ).all()

    total_alquileres = sum(cantidad for _, cantidad in resultados)

    ingresos = (
        db.scalar(
            select(func.sum(DetallesAlquiler.precio))
            .join(Alquiler, DetallesAlquiler.alquiler_id == Alquiler.id)
            .where(Alquiler.estado.in_(["activo", "devuelto"]))
        )
        or 0
    )

    return {
        "total_alquileres": total_alquileres,
        "alquileres_por_estado": {estado: cantidad for estado, cantidad in resultados},
        "ingresos_registrados": ingresos,
    }
