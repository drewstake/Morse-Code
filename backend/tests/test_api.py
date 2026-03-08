from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_decode_endpoint_returns_text_and_warnings() -> None:
    response = client.post("/decode", json={"input": ".... . .-.. .-.. ---"})

    assert response.status_code == 200
    assert response.json() == {
        "mode": "decode",
        "input": ".... . .-.. .-.. ---",
        "output": "HELLO",
        "warnings": [],
    }


def test_decode_endpoint_flags_invalid_spacing() -> None:
    response = client.post("/decode", json={"input": "....  ."})

    assert response.status_code == 200
    assert response.json()["output"] == "?"
    assert response.json()["warnings"][0]["code"] == "INVALID_MORSE_SPACING"


def test_encode_endpoint_handles_unsupported_characters() -> None:
    response = client.post("/encode", json={"input": "HI %"})

    assert response.status_code == 200
    assert response.json()["output"] == ".... ..   ?"
    assert response.json()["warnings"][0]["code"] == "UNSUPPORTED_TEXT_CHARACTERS"
