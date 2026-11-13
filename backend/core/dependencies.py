from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models.user import Usuarios
from core.security import verificar_token

bearer_scheme = HTTPBearer(auto_error=False)


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuarios:

    if credenciales is None or credenciales.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario_id = verificar_token(credenciales.credentials)

    usuario = db.get(Usuarios, usuario_id)

    if usuario is None or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario
