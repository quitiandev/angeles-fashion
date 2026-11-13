from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import Usuarios
from schemas.auth import LoginRequest, TokenResponse
from core.security import verificar_contrasena, crear_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def iniciar_sesion(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuarios).filter(Usuarios.correo == str(datos.correo)).first()

    if (
        usuario is None
        or not usuario.activo
        or not verificar_contrasena(datos.contrasena, usuario.contrasena_hashed)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = crear_token(usuario.id)

    return TokenResponse(access_token=token)
