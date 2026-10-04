from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.factory import crear_app


@pytest.fixture
def client():
    with TestClient(crear_app()) as client:
        yield client


@pytest.fixture
def dataset():
    return (Path(__file__).resolve().parents[1] / "dataset/dataset.json").read_bytes()
