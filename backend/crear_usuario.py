from getpass import getpass

from sqlalchemy import select

from database import session_local
from models.user import Usuarios
from core.security import generar_hash


def crear_usuario():
    nombre = input("Nombre: ").strip()
    correo = input("Correo: ").strip().lower()
    contrasena = getpass("Contraseña: ")

    if not nombre or not correo or not contrasena:
        print("Todos los campos son obligatorios.")
        return

    if len(nombre) > 50 or len(correo) > 100:
        print("El nombre o correo supera el límite permitido.")
        return

    if len(contrasena) < 12:
        print("La contraseña debe tener al menos 12 caracteres.")
        return

    with session_local() as db:
        existente = db.scalar(select(Usuarios).where(Usuarios.correo == correo))

        if existente:
            print("Ya existe un usuario con ese correo.")
            return

        usuario = Usuarios(
            nombre=nombre,
            correo=correo,
            contrasena_hashed=generar_hash(contrasena),
            activo=True,
        )

        db.add(usuario)
        db.commit()

        print("Usuario creado correctamente.")


if __name__ == "__main__":
    crear_usuario()
