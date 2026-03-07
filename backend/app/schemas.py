from typing import Literal

from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    input: str = ""


class TranslationWarning(BaseModel):
    code: Literal[
        "EMPTY_INPUT",
        "INVALID_MORSE_CHARACTERS",
        "UNKNOWN_MORSE_TOKENS",
        "UNSUPPORTED_TEXT_CHARACTERS",
    ]
    message: str
    items: list[str] = Field(default_factory=list)


class TranslationResponse(BaseModel):
    mode: Literal["decode", "encode"]
    input: str
    output: str
    warnings: list[TranslationWarning] = Field(default_factory=list)
