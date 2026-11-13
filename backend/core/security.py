from pwdlib import PasswordHash
import os
from datetime import datetime, timedelta, timezone
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, status

password_hash = PasswordHash.recommended()


def generar_hash(contrasena: str) -> str:
    return password_hash.hash(contrasena)


def verificar_contrasena(contrasena: str, contrasena_hashed: str) -> bool:
    return password_hash.verify(contrasena, contrasena_hashed)


load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET no está configurado")


def crear_token(usuario_id: int) -> str:
    ahora = datetime.now(timezone.utc)

    datos = {
        "sub": str(usuario_id),
        "iat": ahora,
        "exp": ahora + timedelta(minutes=JWT_EXPIRATION_MINUTES),
    }

    return jwt.encode(datos, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verificar_token(token: str) -> int:
    try:
        datos = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        usuario_id = datos.get("sub")

        if usuario_id is None:
            raise ValueError("Token no identificado")

        return int(usuario_id)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token es inválido o expiró",
            headers={"WWW-Authenticate": "Bearer"},
        )
