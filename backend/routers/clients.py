from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models.client import Clientes
from schemas.client import ClienteCreate
from core.dependencies import obtener_usuario_actual

from models.sale import Ventas
from models.rental import Alquiler

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(obtener_usuario_actual)],
)


@router.post("/", status_code=201)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    documento = cliente.documento_identidad.strip()

    existente = db.scalar(
        select(Clientes).where(Clientes.documento_identidad == documento)
    )

    if existente:
        raise HTTPException(
            status_code=409, detail="Ya existe un cliente con ese documento"
        )

    if cliente.correo is not None:
        correo_existente = db.scalar(
            select(Clientes).where(Clientes.correo == str(cliente.correo))
        )

        if correo_existente:
            raise HTTPException(
                status_code=409, detail="Ya existe un cliente con ese correo"
            )

    nuevo_cliente = Clientes(
        nombre=cliente.nombre,
        apellido=cliente.apellido,
        documento_identidad=documento,
        telefono=cliente.telefono,
        correo=str(cliente.correo) if cliente.correo else None,
    )

    db.add(nuevo_cliente)

    try:
        db.commit()
        db.refresh(nuevo_cliente)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="El documento o correo ya está registrado"
        )

    return {"mensaje": "Cliente registrado correctamente", "id": nuevo_cliente.id}


@router.get("/")
def listar_clientes(db: Session = Depends(get_db)):
    clientes = db.scalars(select(Clientes).order_by(Clientes.id)).all()

    return [
        {
            "id": cliente.id,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "documento_identidad": cliente.documento_identidad,
            "telefono": cliente.telefono,
            "correo": cliente.correo,
            "creado_en": cliente.creado_en,
        }
        for cliente in clientes
    ]


@router.get("/{cliente_id}")
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.get(Clientes, cliente_id)

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return {
        "id": cliente.id,
        "nombre": cliente.nombre,
        "apellido": cliente.apellido,
        "documento_identidad": cliente.documento_identidad,
        "telefono": cliente.telefono,
        "correo": cliente.correo,
        "creado_en": cliente.creado_en,
    }


@router.put("/{cliente_id}")
def actualizar_cliente(
    cliente_id: int, datos: ClienteCreate, db: Session = Depends(get_db)
):
    cliente = db.get(Clientes, cliente_id)

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    documento_existente = db.scalar(
        select(Clientes).where(
            Clientes.documento_identidad == datos.documento_identidad,
            Clientes.id != cliente_id,
        )
    )

    if documento_existente:
        raise HTTPException(
            status_code=409, detail="Ya existe otro cliente con ese documento"
        )

    if datos.correo is not None:
        correo_existente = db.scalar(
            select(Clientes).where(
                Clientes.correo == str(datos.correo), Clientes.id != cliente_id
            )
        )

        if correo_existente:
            raise HTTPException(
                status_code=409, detail="Ya existe otro cliente con ese correo"
            )

    cliente.nombre = datos.nombre
    cliente.apellido = datos.apellido
    cliente.documento_identidad = datos.documento_identidad
    cliente.telefono = datos.telefono
    cliente.correo = str(datos.correo) if datos.correo else None

    try:
        db.commit()
        db.refresh(cliente)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="El documento o correo ya está registrado"
        )

    return {"mensaje": "Cliente actualizado correctamente", "id": cliente.id}


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.get(Clientes, cliente_id)

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    tiene_ventas = db.scalar(
        select(Ventas.id).where(Ventas.cliente_id == cliente_id).limit(1)
    )

    tiene_alquileres = db.scalar(
        select(Alquiler.id).where(Alquiler.cliente_id == cliente_id).limit(1)
    )

    if tiene_ventas is not None or tiene_alquileres is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar un cliente con ventas o alquileres registrados",
        )

    try:
        db.delete(cliente)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar el cliente porque tiene registros relacionados",
        )
