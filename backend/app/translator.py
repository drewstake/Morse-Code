import json
import re
from functools import lru_cache
from pathlib import Path

from .schemas import TranslationResponse, TranslationWarning

MORSE_TOKEN_PATTERN = re.compile(r"^[.-]+$")
MAX_WARNING_ITEMS = 5


def _pluralize(count: int, singular: str, plural: str) -> str:
    return singular if count == 1 else plural


def _collect_items(values: list[str]) -> list[str]:
    seen: dict[str, None] = {}
    for value in values:
        seen.setdefault(value, None)
    return list(seen.keys())[:MAX_WARNING_ITEMS]


def _empty_warning(mode: str) -> TranslationWarning:
    prompt = "Enter Morse code to decode." if mode == "decode" else "Enter text to encode."
    return TranslationWarning(code="EMPTY_INPUT", message=prompt)


def _normalize_newlines(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def _split_decode_words(value: str) -> list[list[str]]:
    words: list[list[str]] = []
    current_word: list[str] = []
    current_token = ""
    index = 0

    def push_token() -> None:
        nonlocal current_token
        if not current_token:
            return

        current_word.append(current_token)
        current_token = ""

    def push_word() -> None:
        nonlocal current_word
        push_token()
        if not current_word:
            return

        words.append(current_word)
        current_word = []

    while index < len(value):
        if value[index] != " ":
            current_token += value[index]
            index += 1
            continue

        run_end = index
        while run_end < len(value) and value[run_end] == " ":
            run_end += 1

        run_length = run_end - index
        if run_length == 1:
            push_token()
        elif run_length == 3:
            push_word()
        else:
            current_token += " " * run_length

        index = run_end

    push_word()
    return words


@lru_cache(maxsize=1)
def load_morse_map() -> dict[str, str]:
    mapping_path = Path(__file__).resolve().parents[2] / "shared" / "morse-map.json"
    return json.loads(mapping_path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_reverse_morse_map() -> dict[str, str]:
    return {morse: character for character, morse in load_morse_map().items()}


def decode_morse(raw_input: str) -> TranslationResponse:
    normalized_input = _normalize_newlines(raw_input).strip()
    if not normalized_input:
        return TranslationResponse(
            mode="decode",
            input=raw_input,
            output="",
            warnings=[_empty_warning("decode")],
        )

    reverse_map = load_reverse_morse_map()
    invalid_spacing_tokens: list[str] = []
    invalid_tokens: list[str] = []
    unknown_tokens: list[str] = []
    expanded_input = re.sub(r" *\n+ *", "   ", normalized_input)
    words = _split_decode_words(expanded_input)
    decoded_words: list[str] = []

    for word in words:
        decoded_letters: list[str] = []
        for token in word:
            if " " in token:
                invalid_spacing_tokens.append(token)
                decoded_letters.append("?")
                continue

            if not MORSE_TOKEN_PATTERN.fullmatch(token):
                invalid_tokens.append(token)
                decoded_letters.append("?")
                continue

            decoded_letter = reverse_map.get(token)
            if decoded_letter is None:
                unknown_tokens.append(token)
                decoded_letters.append("?")
                continue

            decoded_letters.append(decoded_letter)

        decoded_words.append("".join(decoded_letters))

    warnings: list[TranslationWarning] = []

    if invalid_spacing_tokens:
        count = len(invalid_spacing_tokens)
        warnings.append(
            TranslationWarning(
                code="INVALID_MORSE_SPACING",
                message=(
                    f"Found invalid Morse spacing in {count} "
                    f"{_pluralize(count, 'section', 'sections')}; affected sections decoded as ?."
                ),
                items=_collect_items(invalid_spacing_tokens),
            )
        )

    if invalid_tokens:
        count = len(invalid_tokens)
        warnings.append(
            TranslationWarning(
                code="INVALID_MORSE_CHARACTERS",
                message=(
                    f"Found invalid Morse characters in {count} "
                    f"{_pluralize(count, 'token', 'tokens')}; affected tokens decoded as ?."
                ),
                items=_collect_items(invalid_tokens),
            )
        )

    if unknown_tokens:
        count = len(unknown_tokens)
        warnings.append(
            TranslationWarning(
                code="UNKNOWN_MORSE_TOKENS",
                message=(
                    f"Decoded {count} unknown Morse "
                    f"{_pluralize(count, 'token', 'tokens')} as ?."
                ),
                items=_collect_items(unknown_tokens),
            )
        )

    return TranslationResponse(
        mode="decode",
        input=raw_input,
        output=" ".join(decoded_words),
        warnings=warnings,
    )


def encode_text(raw_input: str) -> TranslationResponse:
    normalized_input = _normalize_newlines(raw_input).strip()
    if not normalized_input:
        return TranslationResponse(
            mode="encode",
            input=raw_input,
            output="",
            warnings=[_empty_warning("encode")],
        )

    morse_map = load_morse_map()
    unsupported_characters: list[str] = []
    encoded_words: list[str] = []

    for word in [part for part in re.split(r"\s+", normalized_input) if part]:
        encoded_letters: list[str] = []
        for character in word.upper():
            encoded_token = morse_map.get(character)
            if encoded_token is None:
                unsupported_characters.append(character)
                encoded_letters.append("?")
                continue

            encoded_letters.append(encoded_token)

        encoded_words.append(" ".join(encoded_letters))

    warnings: list[TranslationWarning] = []

    if unsupported_characters:
        count = len(unsupported_characters)
        warnings.append(
            TranslationWarning(
                code="UNSUPPORTED_TEXT_CHARACTERS",
                message=(
                    f"Encoded {count} unsupported "
                    f"{_pluralize(count, 'character', 'characters')} as ?."
                ),
                items=_collect_items(unsupported_characters),
            )
        )

    return TranslationResponse(
        mode="encode",
        input=raw_input,
        output="   ".join(encoded_words),
        warnings=warnings,
    )
