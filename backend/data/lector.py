from typing import Protocol


class LectorDataset(Protocol):


    def leer(self, texto: str) -> dict: ...
