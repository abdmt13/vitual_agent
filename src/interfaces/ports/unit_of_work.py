from abc import ABC, abstractmethod
from typing import Any


class IUnitOfWork(ABC):
    """Interfaz abstracta para el patrón Unit of Work."""

    async def __aenter__(self) -> "IUnitOfWork":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_type is not None:
            await self.rollback()
        else:
            await self.commit()

    @abstractmethod
    async def commit(self) -> None:
        """Confirma los cambios en la transacción actual."""
        raise NotImplementedError

    @abstractmethod
    async def rollback(self) -> None:
        """Revierte los cambios de la transacción actual."""
        raise NotImplementedError
