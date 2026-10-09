import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import (
    Alquiler,
    Categorias,
    Clientes,
    DetallesAlquiler,
    DetallesVenta,
    Prendas,
    Usuarios,
    Ventas,
)
from models.base import Base

load_dotenv()

database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url)

session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
