from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.user import Usuarios
from core.dependencies import obtener_usuario_actual
from core.security import generar_hash

from schemas.user import (
    UsuarioCrear,
    UsuarioActualizar,
    UsuarioCambiarContrasena,
    UsuarioCambiarEstado,
    UsuarioRespuesta,
)

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(obtener_usuario_actual)],
)


def buscar_usuario(db: Session, usuario_id: int) -> Usuarios:
    usuario = db.get(Usuarios, usuario_id)

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    return usuario


def verificar_correo(
    db: Session,
    correo: str,
    excluir_id: int | None = None,
):
    consulta = db.query(Usuarios).filter(func.lower(Usuarios.correo) == correo.lower())

    if excluir_id is not None:
        consulta = consulta.filter(Usuarios.id != excluir_id)

    if consulta.first() is not None:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un usuario con ese correo",
        )


def guardar_cambios(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se pudieron guardar los cambios. Verifica el correo.",
        )


@router.get("/", response_model=list[UsuarioRespuesta])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuarios).order_by(Usuarios.id).all()


@router.post(
    "/",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_usuario(
    datos: UsuarioCrear,
    db: Session = Depends(get_db),
):
    nombre = datos.nombre.strip()
    correo = str(datos.correo).strip().lower()

    if len(nombre) < 2:
        raise HTTPException(
            status_code=422,
            detail="El nombre debe tener al menos 2 caracteres",
        )

    verificar_correo(db, correo)

    nuevo_usuario = Usuarios(
        nombre=nombre,
        correo=correo,
        contrasena_hashed=generar_hash(datos.contrasena),
        activo=True,
    )

    db.add(nuevo_usuario)
    guardar_cambios(db)
    db.refresh(nuevo_usuario)

    return nuevo_usuario


@router.put("/{usuario_id}", response_model=UsuarioRespuesta)
def actualizar_usuario(
    usuario_id: int,
    datos: UsuarioActualizar,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario(db, usuario_id)

    nombre = datos.nombre.strip()
    correo = str(datos.correo).strip().lower()

    if len(nombre) < 2:
        raise HTTPException(
            status_code=422,
            detail="El nombre debe tener al menos 2 caracteres",
        )

    verificar_correo(db, correo, excluir_id=usuario_id)

    usuario.nombre = nombre
    usuario.correo = correo

    guardar_cambios(db)
    db.refresh(usuario)

    return usuario


@router.patch("/{usuario_id}/contrasena")
def cambiar_contrasena(
    usuario_id: int,
    datos: UsuarioCambiarContrasena,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario(db, usuario_id)

    usuario.contrasena_hashed = generar_hash(datos.contrasena)

    guardar_cambios(db)

    return {"mensaje": "Contraseña actualizada correctamente"}


@router.patch(
    "/{usuario_id}/estado",
    response_model=UsuarioRespuesta,
)
def cambiar_estado(
    usuario_id: int,
    datos: UsuarioCambiarEstado,
    db: Session = Depends(get_db),
    usuario_actual: Usuarios = Depends(obtener_usuario_actual),
):
    usuario = buscar_usuario(db, usuario_id)

    if usuario.id == usuario_actual.id and not datos.activo:
        raise HTTPException(
            status_code=400,
            detail="No puedes desactivar tu propia cuenta",
        )

    usuario.activo = datos.activo

    guardar_cambios(db)
    db.refresh(usuario)

    return usuario
