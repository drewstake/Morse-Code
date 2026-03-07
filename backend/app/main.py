from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .schemas import TranslationRequest, TranslationResponse
from .translator import decode_morse, encode_text

app = FastAPI(
    title="Morse Translator API",
    description="FastAPI backend for Morse code encode and decode operations.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/decode", response_model=TranslationResponse)
def decode(request: TranslationRequest) -> TranslationResponse:
    return decode_morse(request.input)


@app.post("/encode", response_model=TranslationResponse)
def encode(request: TranslationRequest) -> TranslationResponse:
    return encode_text(request.input)
