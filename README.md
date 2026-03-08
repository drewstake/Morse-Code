# Morse Translator

## Overview
This repo contains an interview-ready Morse code translator built for the Innovative Owl take-home assignment.

It is intentionally split into two parts:

- `frontend/`: a React + Vite + TypeScript single-page app that performs translation entirely in the browser
- `backend/`: a FastAPI API that exposes the same encode/decode behavior for local demonstration and testing

The live Firebase Hosting deployment only serves the frontend. That is a deliberate architecture choice: Firebase Hosting can serve the static React app directly, while the Python backend remains available locally to demonstrate API design, validation, and test coverage.

## Assignment Goals
- Decode pasted Morse code into uppercase text
- Support a simple encode mode for the reverse flow
- Handle spacing rules exactly and predictably
- Surface validation warnings without cluttering the UI
- Save recent translations locally without adding a database
- Keep the project easy to run, easy to review, and easy to deploy

## Features
- Single-page React interface
- Decode mode with `Morse Input` and `Decoded Output`
- Encode mode with matching spacing conventions
- `Decode` / `Encode`, `Clear`, and `Copy Output` actions
- Friendly warning panel for empty input, invalid Morse tokens, unknown Morse tokens, and unsupported text characters
- Recent translation history stored in browser `localStorage`
- Click-to-reuse history items
- Clear history action
- FastAPI `/decode` and `/encode` endpoints
- Shared Morse lookup table used by both frontend and backend
- Focused frontend and backend tests
- Firebase Hosting configuration for project `morse-code-34b27`

## Tech Stack
- React: simple state-driven UI for a single interactive screen
- Vite: fast local startup and straightforward static build output for Firebase Hosting
- TypeScript: lightweight safety for UI state, warning objects, and translation helpers
- FastAPI: small, readable Python API with automatic docs and typed request/response models
- Pytest: concise backend unit and API tests
- Vitest: fast utility-level frontend tests that run close to the browser code
- Firebase Hosting: static hosting for the Vite build output
- `localStorage`: durable client-side history without introducing backend persistence

## Why This Architecture
Firebase Hosting can deploy the React app directly, but it does not run a plain FastAPI server by itself. Because the assignment asked for both a React frontend and a Python backend, the project uses this split:

```text
Firebase Hosting
    |
    v
React frontend (production runtime)
    |
    +--> local translation logic for decode/encode
    +--> localStorage for recent history

FastAPI backend (local/API demo)
    |
    +--> same parsing rules
    +--> same warning behavior
    +--> same Morse mapping
```

Why this is practical:

- The deployed site works independently because the browser contains the core translation logic.
- The backend still shows full-stack ability, API modeling, validation behavior, and Python tests.
- A shared Morse mapping file keeps the character table aligned without forcing a heavier cross-language shared package.

## Project Structure
```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── translator.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_api.py
│   │   └── test_translator.py
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── style.css
│   │   ├── types.ts
│   │   └── utils/
│   │       ├── history.ts
│   │       ├── translator.ts
│   │       └── translator.test.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared/
│   └── morse-map.json
├── .firebaserc
├── firebase.json
└── README.md
```

## How The App Works
At a high level, the app always follows the same pattern:

```text
User input
   -> normalize whitespace
   -> parse by mode
   -> validate tokens or characters
   -> translate using the Morse map
   -> collect warnings
   -> render output
   -> optionally save to recent history
```

The frontend owns the live user experience. The backend mirrors the same rules for API usage and testable server-side behavior.

## Decode Flow
```text
Morse textarea
   -> normalize CRLF/newlines
   -> trim outer whitespace
   -> convert newline groups into word breaks
   -> split words on 3+ spaces
   -> split letters on 1 or 2 spaces
   -> validate each token
   -> map token to uppercase character
   -> use ? for invalid or unknown tokens
   -> join letters into words
   -> join words with single spaces
```

Implementation notes:

- Tokens are valid only if every character is `.` or `-`.
- Tokens with invalid characters decode as `?` and trigger `INVALID_MORSE_CHARACTERS`.
- Tokens made only of `.` and `-` but missing from the map decode as `?` and trigger `UNKNOWN_MORSE_TOKENS`.
- Leading and trailing whitespace is ignored before parsing.

## Encode Flow
```text
Text textarea
   -> normalize CRLF/newlines
   -> trim outer whitespace
   -> split on whitespace into words
   -> uppercase supported letters
   -> map each character to Morse
   -> use ? for unsupported characters
   -> join letters with single spaces
   -> join words with three spaces
```

Implementation notes:

- Lowercase letters are normalized to uppercase before lookup.
- Digits and a small punctuation set are supported.
- Unsupported characters are encoded as `?` and trigger `UNSUPPORTED_TEXT_CHARACTERS`.
- Whitespace is treated as a word separator, not as a character to encode.

## History Flow
```text
Successful translate button click
   -> build history item
   -> dedupe exact repeats by mode/input/output
   -> unshift newest item to the front
   -> cap list at 12 items
   -> save JSON in localStorage
```

Reload flow:

```text
App start
   -> read localStorage
   -> validate shape
   -> hydrate history sidebar
```

Reuse flow:

```text
User clicks history item
   -> restore mode
   -> restore input
   -> rerun translation
   -> show current output + warnings
```

## Validation Flow
The UI separates warnings from output on purpose. Output still renders even when warnings exist so the user gets partial value instead of a hard failure.

Validation rules are aggregated into structured warnings:

- `EMPTY_INPUT`
- `INVALID_MORSE_CHARACTERS`
- `UNKNOWN_MORSE_TOKENS`
- `UNSUPPORTED_TEXT_CHARACTERS`

Each warning contains:

- a stable `code`
- a short readable `message`
- up to 5 example `items` to keep the UI concise

## Parsing Rules
- Outer whitespace is trimmed before translation.
- In decode mode, one or two spaces separate letters.
- In decode mode, three or more spaces separate words.
- In decode mode, newlines count as word breaks, same as three spaces.
- In encode mode, runs of whitespace become word breaks.
- Decode output joins words with single spaces.
- Encode output joins Morse letters with single spaces and Morse words with three spaces.

## Validation Rules
- Empty decode input: return empty output and a friendly prompt to enter Morse code.
- Empty encode input: return empty output and a friendly prompt to enter text.
- Invalid decode token characters: decode that token as `?`.
- Unknown decode token: decode that token as `?`.
- Unsupported encode character: encode that character as `?`.
- Warnings are aggregated by category instead of repeated per character.
- Empty-input actions are not added to history.

## Data Structures
### Shared Morse Map
File: `shared/morse-map.json`

Shape:

```json
{
  "A": ".-",
  "B": "-...",
  "...": "..."
}
```

Why it was used:

- Both frontend and backend need the same source-of-truth mapping.
- JSON keeps the file language-agnostic and reviewable.
- Reverse lookup tables can be generated cheaply at runtime.

### Translation Warning
Frontend and backend use the same conceptual structure:

```ts
type TranslationWarning = {
  code: 'EMPTY_INPUT' | 'INVALID_MORSE_CHARACTERS' | 'UNKNOWN_MORSE_TOKENS' | 'UNSUPPORTED_TEXT_CHARACTERS'
  message: string
  items: string[]
}
```

Why it was used:

- The UI can style warnings by type without parsing strings.
- Tests can assert stable behavior via `code`.
- `items` provides concise examples without flooding the screen.

### Translation Result
Conceptual shape:

```ts
type TranslationResult = {
  output: string
  warnings: TranslationWarning[]
}
```

Why it was used:

- Translation always returns usable output plus validation context.
- The frontend and backend both follow the same mental model.

### History Item
Stored in localStorage and used by the sidebar:

```ts
type HistoryItem = {
  id: string
  mode: 'decode' | 'encode'
  input: string
  output: string
  timestamp: string
}
```

Why it was used:

- `id` gives React a stable key.
- `mode` tells the app how to rerun the translation.
- `input` and `output` make the history item independently reviewable.
- `timestamp` supports readable auditability for a reviewer.

### localStorage History Structure
Storage key: `morse-translator-history`

Stored value:

```json
[
  {
    "id": "b5ccf575-0b24-490a-a68e-8f7b8f42c3ca",
    "mode": "decode",
    "input": ".... . .-.. .-.. ---",
    "output": "HELLO",
    "timestamp": "2026-03-07T19:42:18.313Z"
  }
]
```

Why localStorage was used instead of a database:

- The assignment explicitly did not require backend persistence.
- The history is user-local, small, and low-risk.
- Firebase Hosting can serve the full experience without needing a database product or backend session layer.
- It keeps setup and review friction low.

## API Endpoints
The FastAPI app intentionally exposes only the two assignment endpoints. Local interactive docs are also available at `/docs` when the backend is running.

### `POST /decode`
Purpose: translate Morse code into uppercase text while returning validation warnings.

Request body shape:

```json
{
  "input": ".... . .-.. .-.. ---"
}
```

Response shape:

```json
{
  "mode": "decode",
  "input": ".... . .-.. .-.. ---",
  "output": "HELLO",
  "warnings": []
}
```

Example request:

```bash
curl -X POST http://127.0.0.1:8000/decode ^
  -H "Content-Type: application/json" ^
  -d "{\"input\":\".... ..-.- ..x\"}"
```

Example response:

```json
{
  "mode": "decode",
  "input": ".... ..-.- ..x",
  "output": "H??",
  "warnings": [
    {
      "code": "INVALID_MORSE_CHARACTERS",
      "message": "Found invalid Morse characters in 1 token; affected tokens decoded as ?.",
      "items": ["..x"]
    },
    {
      "code": "UNKNOWN_MORSE_TOKENS",
      "message": "Decoded 1 unknown Morse token as ?.",
      "items": ["..-.-"]
    }
  ]
}
```

### `POST /encode`
Purpose: translate text into Morse code while returning warnings for unsupported characters.

Request body shape:

```json
{
  "input": "HEY JUDE"
}
```

Response shape:

```json
{
  "mode": "encode",
  "input": "HEY JUDE",
  "output": ".... . -.--   .--- ..- -.. .",
  "warnings": []
}
```

Example request:

```bash
curl -X POST http://127.0.0.1:8000/encode ^
  -H "Content-Type: application/json" ^
  -d "{\"input\":\"HI 😊\"}"
```

Example response:

```json
{
  "mode": "encode",
  "input": "HI 😊",
  "output": ".... ..   ?",
  "warnings": [
    {
      "code": "UNSUPPORTED_TEXT_CHARACTERS",
      "message": "Encoded 1 unsupported character as ?.",
      "items": ["😊"]
    }
  ]
}
```

## Frontend State Model
The React app keeps state intentionally small:

```ts
{
  mode: 'decode' | 'encode'
  input: string
  output: string
  warnings: TranslationWarning[]
  copyMessage: string
  history: HistoryItem[]
}
```

Why this shape works:

- `mode`, `input`, and `output` directly represent the screen.
- `warnings` stays separate from output so the UI can show partial success cleanly.
- `copyMessage` is transient UI feedback and does not belong in persistent history.
- `history` is loaded lazily from `localStorage` to avoid unnecessary work on each render.

## Tradeoffs And Design Decisions
### Why frontend translation logic exists
- Firebase Hosting serves the live build with no Python runtime.
- Keeping translation in the browser guarantees the deployed site still works end to end.
- The frontend becomes the production runtime, not just a thin demo shell.

### Why the Python backend is still included
- It satisfies the stack requirement.
- It demonstrates API design, typed schemas, backend validation, and Python testing.
- It gives reviewers a clean server-side reference implementation.

### Why the logic is not fully shared across languages
- The translation algorithm is small and readable in both TypeScript and Python.
- Forcing full cross-language code generation would add more complexity than value for this assignment.
- The Morse map itself is shared to reduce the main consistency risk.

### Why warnings are aggregated
- Repeating a warning for every bad character creates noisy UX.
- Grouping by warning type keeps the message readable while still exposing example items.

### Why unsupported encode characters become `?`
- It mirrors the decode behavior for unknown Morse tokens.
- The user still gets a complete output string with visible fallback markers.
- This is easier to reason about than silently dropping characters.

## Testing
Backend coverage:

- decode samples from the assignment
- encode samples
- one-space/two-space letter handling
- newline word handling
- unknown Morse token behavior
- invalid decode character behavior
- unsupported encode character behavior
- API endpoint smoke tests

Frontend coverage:

- sample decode cases
- spacing behavior
- warning behavior for invalid and unsupported input
- encode spacing behavior

Commands:

```bash
pytest backend/tests
npm --prefix frontend run test
```

## Local Development
### Frontend
```bash
cd frontend
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173`.

### Backend
```bash
cd backend
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

The FastAPI app runs at `http://127.0.0.1:8000` and exposes docs at `http://127.0.0.1:8000/docs`.

### Running both
Run the frontend and backend in separate terminals. The frontend does not require the backend for normal usage, but both can run side by side for review.

## Firebase Deployment
This repo is already configured for Firebase project `morse-code-34b27`.

Relevant files:

- `.firebaserc`: sets the default project id
- `firebase.json`: points Hosting at `frontend/dist` and rewrites all routes to `index.html`

Deploy steps:

```bash
npm --prefix frontend install
npm --prefix frontend run build
firebase deploy --only hosting
```

If Firebase CLI is not installed yet:

```bash
npm install -g firebase-tools
firebase login
```

Important deployment note:

- The deployed Firebase site runs the React app only.
- The Python FastAPI backend is included for local/API demonstration and is not hosted by Firebase Hosting in this repo.

## Edge Cases Handled
- Leading and trailing whitespace in both modes
- Windows newlines and Unix newlines
- One or two spaces between Morse letters
- Three or more spaces between Morse words
- Multiple blank lines between words
- Unknown Morse tokens
- Invalid Morse characters inside a token
- Unsupported text characters such as emoji
- Lowercase text input in encode mode
- Repeated history items, which are moved to the front instead of duplicated
- Empty input actions, which show helpful warnings but do not pollute history

## Future Improvements
- Add keyboard shortcuts such as `Ctrl+Enter` to translate
- Add an optional server-backed deployment target for the FastAPI API, such as Cloud Run
- Add copy-to-input shortcuts from history items
- Add browser integration tests for the UI flow
- Add export/import support for local translation history
