"""Declarative metadata compartida por Alembic y futuros modelos."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarativa sin modelos de negocio en esta microfase."""

