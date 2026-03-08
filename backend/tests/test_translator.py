import pytest

from backend.app.translator import decode_morse, encode_text


@pytest.mark.parametrize(
    ("raw_input", "expected_output"),
    [
        (".... . .-.. .-.. ---", "HELLO"),
        (".... . .-.. .-.. ---   .-- --- .-. .-.. -..", "HELLO WORLD"),
        ("... --- ...", "SOS"),
        (".... . -.--   .--- ..- -.. .", "HEY JUDE"),
    ],
)
def test_decode_examples(raw_input: str, expected_output: str) -> None:
    result = decode_morse(raw_input)

    assert result.output == expected_output
    assert result.warnings == []


def test_decode_treats_newlines_as_word_breaks() -> None:
    result = decode_morse(".... . -.--\n.--- ..- -.. .")

    assert result.output == "HEY JUDE"
    assert result.warnings == []


def test_decode_flags_invalid_spacing() -> None:
    result = decode_morse("....  .")

    assert result.output == "?"
    assert [warning.code for warning in result.warnings] == ["INVALID_MORSE_SPACING"]
    assert result.warnings[0].items == ["....  ."]


def test_decode_unknown_and_invalid_tokens_decode_as_question_marks() -> None:
    result = decode_morse(".... ..-.- ..x")

    assert result.output == "H??"
    assert [warning.code for warning in result.warnings] == [
        "INVALID_MORSE_CHARACTERS",
        "UNKNOWN_MORSE_TOKENS",
    ]
    assert result.warnings[0].items == ["..x"]
    assert result.warnings[1].items == ["..-.-"]


def test_decode_empty_input_returns_helpful_warning() -> None:
    result = decode_morse("   \n  ")

    assert result.output == ""
    assert result.warnings[0].code == "EMPTY_INPUT"


def test_decode_warning_counts_track_repeated_occurrences() -> None:
    result = decode_morse("..x ..x")

    assert (
        result.warnings[0].message
        == "Found invalid Morse characters in 2 tokens; affected tokens decoded as ?."
    )
    assert result.warnings[0].items == ["..x"]


@pytest.mark.parametrize(
    ("raw_input", "expected_output"),
    [
        ("HELLO", ".... . .-.. .-.. ---"),
        ("HEY JUDE", ".... . -.--   .--- ..- -.. ."),
        ("SOS", "... --- ..."),
    ],
)
def test_encode_examples(raw_input: str, expected_output: str) -> None:
    result = encode_text(raw_input)

    assert result.output == expected_output
    assert result.warnings == []


def test_encode_collapses_whitespace_into_word_breaks() -> None:
    result = encode_text("hello\n\nworld")

    assert result.output == ".... . .-.. .-.. ---   .-- --- .-. .-.. -.."
    assert result.warnings == []


def test_encode_unsupported_characters_warn_and_use_question_marks() -> None:
    result = encode_text("HI %")

    assert result.output == ".... ..   ?"
    assert result.warnings[0].code == "UNSUPPORTED_TEXT_CHARACTERS"
    assert result.warnings[0].items == ["%"]


def test_encode_warning_counts_track_repeated_occurrences() -> None:
    result = encode_text("%%")

    assert result.warnings[0].message == "Encoded 2 unsupported characters as ?."
    assert result.warnings[0].items == ["%"]
