# Morse Translator

This is my Morse code translator take-home project for Innovative Owl. I built it as a small full-stack app with a React + Vite + TypeScript frontend and a FastAPI backend. The live Firebase deployment runs entirely from the frontend, and the Python backend is included as a local API version so I could show the same behavior, typed request/response models, and backend tests.

## 1. Project Overview

I built this app to solve the take-home assignment in a way that was easy to review and easy to run.

The app does two things:

- It decodes Morse code into uppercase text.
- It encodes plain text back into Morse code.

The main requirements I targeted were:

- a React frontend
- a Python backend
- correct Morse spacing behavior
- clear validation feedback
- a clean UI that makes the flow obvious

I also added a few extras that were not strictly required but made the project stronger:

- encode mode as a first-class flow
- saved recent history in `localStorage`
- copy output support
- structured warnings instead of vague error text
- backend and frontend unit tests
- Firebase Hosting config for the frontend

The final result is a frontend that works on its own when deployed, plus a backend API that mirrors the same translation rules locally. I chose that split because it keeps the hosted app simple while still showing full-stack work.

## 2. Features

- Decode mode for Morse -> text
- Encode mode for text -> Morse
- Structured warnings for empty input, invalid Morse tokens, unknown Morse tokens, and unsupported text characters
- Copy output button using the browser clipboard API
- Clear button for current input/output/warnings
- Recent history sidebar with click-to-reuse items
- Local persistence through `localStorage`
- History deduping and capped history length
- Frontend unit tests for translation utilities
- Backend unit tests and API smoke tests
- Live frontend deployment through Firebase Hosting
- Local FastAPI backend with `/decode` and `/encode`

## 3. Tech Stack

### React

I used React for the UI because the app is mostly state-driven: mode, input, output, warnings, copy state, and history. React kept that logic straightforward without adding framework overhead I did not need.

### Vite

I used Vite because it is fast to start, fast to build, and a good fit for a static frontend that ends up on Firebase Hosting. For this project, that mattered more than extra build complexity.

### TypeScript

I used TypeScript to make the frontend state and translation helpers safer. The main value here was keeping warning codes, history items, and translation results explicit instead of passing around loosely shaped objects.

### FastAPI

I used FastAPI for the backend because it gave me a small, typed API very quickly. It also gave me automatic docs at `/docs`, which makes the backend easier to inspect during review.

### Firebase Hosting

I used Firebase Hosting for the frontend because the deployed app is a static React build. That made deployment simple: build `frontend/dist`, then serve it as a single-page app.

### localStorage

I used `localStorage` for recent history because this feature is user-local and low-risk. I did not need a database, auth, or backend persistence just to remember a few recent translations.

### pytest

I used `pytest` for backend tests because the translator logic is pure and easy to test directly, and FastAPI works well with `TestClient` for endpoint checks.

### Vitest

I used Vitest for frontend tests because the core translation behavior lives in utility functions. That made it easy to test the important parsing and warning rules without needing a browser automation layer.

## 4. Architecture

I split the project into three parts:

- `frontend/` contains the production user experience.
- `backend/` contains the local API version.
- `shared/` contains the Morse mapping used by both sides.

The important architectural decision is this: the live deployed app works from the frontend alone. Firebase Hosting serves the static React build, so the hosted site does not depend on a running Python service.

I still included the FastAPI backend because the assignment asked for a Python backend, and I wanted to show the same translation logic behind explicit endpoints with tests.

I kept the frontend and backend aligned in two ways:

- I used the same `shared/morse-map.json` file in both places.
- I implemented the same normalization, spacing, fallback, and warning rules in both TypeScript and Python.

I did not build a true single runtime shared across both languages. The translation logic is mirrored, not literally executed from one shared code file. I chose that because the algorithm is small enough to keep readable in both places, and forcing a more complex sharing layer would have been more work than value for this assignment.

### Architecture Diagram

```text
                         +---------------------------+
                         | Firebase Hosting          |
                         | serves frontend/dist      |
                         +-------------+-------------+
                                       |
                                       v
                         +---------------------------+
                         | React + TypeScript UI     |
                         | decode / encode / history |
                         +-------------+-------------+
                                       |
                      +----------------+----------------+
                      |                                 |
                      v                                 v
        +---------------------------+     +---------------------------+
        | shared/morse-map.json     |     | browser localStorage      |
        | character -> Morse table  |     | recent translation history|
        +---------------------------+     +---------------------------+

                         +---------------------------+
                         | FastAPI backend           |
                         | /decode and /encode       |
                         +-------------+-------------+
                                       |
                                       v
                         +---------------------------+
                         | shared/morse-map.json     |
                         +---------------------------+
```

## 5. Project Structure

I kept the repo layout simple so a reviewer can find the important parts quickly.

```text
.
|-- frontend/
|   |-- src/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   |-- style.css
|   |   |-- types.ts
|   |   `-- utils/
|   |       |-- history.ts
|   |       |-- translator.ts
|   |       `-- translator.test.ts
|   |-- index.html
|   |-- package.json
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- backend/
|   |-- app/
|   |   |-- __init__.py
|   |   |-- main.py
|   |   |-- schemas.py
|   |   `-- translator.py
|   |-- tests/
|   |   |-- conftest.py
|   |   |-- test_api.py
|   |   `-- test_translator.py
|   |-- requirements.txt
|   `-- requirements-dev.txt
|-- shared/
|   `-- morse-map.json
|-- .firebaserc
|-- firebase.json
`-- README.md
```

### What each area is for

- `frontend/src/App.tsx`
  The main UI. I keep the mode toggle, input/output flow, warning display, copy action, and history sidebar here.

- `frontend/src/utils/translator.ts`
  The frontend translation logic. This is where I normalize input, parse it, build warnings, and return the final output.

- `frontend/src/utils/history.ts`
  The `localStorage` logic for loading, saving, deduping, and clearing history.

- `frontend/src/types.ts`
  Shared frontend types for translation mode, warnings, results, and history items.

- `backend/app/translator.py`
  The backend translation logic. It mirrors the frontend rules in Python.

- `backend/app/schemas.py`
  Pydantic models for the API request and response bodies.

- `backend/app/main.py`
  The FastAPI app setup, CORS config for local development, and endpoint wiring.

- `backend/tests/`
  Backend translator and API tests.

- `shared/morse-map.json`
  The Morse table both the frontend and backend import.

- `firebase.json` and `.firebaserc`
  The Firebase Hosting configuration for the frontend deploy.

## 6. How the App Works

At a high level, I made the app follow the same pattern in both modes:

```text
User action
  -> choose mode
  -> normalize input
  -> split into words and tokens/characters
  -> translate with the Morse map
  -> collect warnings
  -> render output
  -> optionally save history
```

### Decode Flow

When the user is in decode mode, this is the step-by-step flow:

1. I read the raw textarea input.
2. I normalize Windows and Unix newlines into `\n`.
3. I trim leading and trailing whitespace.
4. I convert newline groups into word breaks by replacing them with three spaces.
5. I split words on three or more spaces.
6. I split letters inside each word on one or two spaces.
7. I validate each Morse token.
8. I decode each valid token through the reverse Morse lookup table.
9. I turn invalid or unknown tokens into `?`.
10. I join decoded letters into words and decoded words into the final text output.
11. I collect any warnings and render both the output and the warning panel.

### Encode Flow

When the user is in encode mode, this is the flow:

1. I read the raw textarea input.
2. I normalize newlines.
3. I trim leading and trailing whitespace.
4. I split the text into words using any run of whitespace.
5. I uppercase the text before lookup.
6. I encode each supported character through the forward Morse map.
7. I turn unsupported characters into `?`.
8. I join Morse letters with one space and Morse words with three spaces.
9. I collect warnings and render the final Morse output.

### Validation Flow

I handle validation as part of translation instead of as a separate blocking step.

1. I run translation even if some parts of the input are bad.
2. I collect issues into warning categories instead of failing on the first problem.
3. I keep a short list of example items for each warning type.
4. I render warnings below the output so the user still gets the translation result.

That means the app can still produce useful output like `H??` or `.... ..   ?` instead of failing hard and giving the user nothing back.

### History Flow

History only updates when the user clicks the main translate button.

1. I run the translation for the current mode and input.
2. I update output and warnings in the UI.
3. If the trimmed input is empty, I stop there and do not save history.
4. Otherwise, I create a history item with `id`, `mode`, `input`, `output`, and `timestamp`.
5. I move that item to the front of the history list.
6. I remove any exact duplicate with the same `mode`, `input`, and `output`.
7. I cap the stored history at 12 items.
8. I write the result to `localStorage`.

When the app starts, I lazy-load history from `localStorage`. When the user clicks a history item, I restore its mode and input, rerun translation, and show the current output and warnings again.

### Data Flow Diagram

```text
Decode mode:
textarea input
  -> normalize newlines + trim
  -> newline groups => word breaks
  -> split on 3+ spaces for words
  -> split on 1-2 spaces for letters
  -> validate Morse tokens
  -> reverse map lookup
  -> output text + warnings

Encode mode:
textarea input
  -> normalize newlines + trim
  -> split on whitespace for words
  -> uppercase text
  -> forward map lookup
  -> output Morse + warnings

After translate:
result
  -> render output
  -> render warnings
  -> save history if input is not empty
```

## 7. Parsing Rules

I wrote the parsing rules to be explicit and predictable.

### Decode Rules

- I trim leading and trailing whitespace before parsing.
- A single space separates Morse letters.
- Two spaces also separate Morse letters.
- Three spaces separate Morse words.
- Three or more spaces are treated as word separators.
- Newlines are treated as word breaks.
- Multiple newlines still collapse into a word break.
- Unknown Morse tokens become `?`.
- Tokens containing characters other than `.` and `-` are treated as invalid and become `?`.

Examples:

```text
.... . .-.. .-.. ---            -> HELLO
....  . -.--                    -> HEY
.... . -.--   .--- ..- -.. .    -> HEY JUDE
.... . -.--
.--- ..- -.. .                  -> HEY JUDE
```

### Encode Rules

- I trim leading and trailing whitespace before parsing.
- I split text words on any whitespace, including spaces and newlines.
- I uppercase text before looking up Morse values.
- I place a single space between Morse letters.
- I place three spaces between Morse words.
- Unsupported text characters become `?`.

Example:

```text
HELLO WORLD -> .... . .-.. .-.. ---   .-- --- .-. .-.. -..
```

### Supported Character Set

The shared Morse map covers:

- letters `A-Z`
- digits `0-9`
- punctuation `. , ? ! ' " / ( ) & : ; = + - _ $ @`

I kept the supported set aligned with the entries in `shared/morse-map.json`.

## 8. Validation Rules

I chose warning-based validation instead of hard failures because a translator is more useful when it can still return a partial result.

### Empty input

- In decode mode, empty or whitespace-only input returns an empty output and an `EMPTY_INPUT` warning with the message `Enter Morse code to decode.`
- In encode mode, empty or whitespace-only input returns an empty output and an `EMPTY_INPUT` warning with the message `Enter text to encode.`
- I do not save empty translations to history.

### Invalid Morse characters

- If a decode token contains anything other than `.` or `-`, I treat that token as invalid.
- The token becomes `?`.
- I add an `INVALID_MORSE_CHARACTERS` warning.

Example:

```text
..x -> ?
```

### Unknown Morse tokens

- If a decode token is made of only `.` and `-` but does not exist in the reverse lookup map, I treat it as unknown.
- The token becomes `?`.
- I add an `UNKNOWN_MORSE_TOKENS` warning.

Example:

```text
..-.- -> ?
```

### Unsupported encode characters

- If a text character is not in the Morse map, I encode it as `?`.
- I add an `UNSUPPORTED_TEXT_CHARACTERS` warning.

Example:

```text
HI % -> .... ..   ?
```

### How warnings are shown

- Warnings are displayed in a dedicated panel below the output.
- Each warning has a stable code, a human-readable message, and a short list of sample items.
- I dedupe sample items and cap them at 5 examples so the UI stays readable.

### Why I chose graceful handling

I wanted users and reviewers to see exactly what succeeded and what did not. For this project, returning partial output with clear warnings felt more useful than rejecting the entire request because of one bad token or unsupported character.

## 9. Data Structures

I kept the data structures small and readable. The goal was to make the translation flow obvious, not to build a complicated abstraction layer.

### Morse mapping structure

I store the shared Morse map in `shared/morse-map.json` as a forward lookup table from character to Morse token.

```json
{
  "A": ".-",
  "B": "-...",
  "C": "-.-."
}
```

What it stores:

- the supported characters
- the Morse token for each character

Why I chose it:

- both frontend and backend can import the same JSON file
- it is easy to review in plain text
- it is easy to extend if I want to support more characters later

Tradeoff:

- decode mode needs a reverse map generated at runtime

### Reverse mapping structure

I build a reverse lookup table in memory for decode mode.

Frontend:

```ts
const reverseMorseMap = Object.fromEntries(
  Object.entries(morseMap).map(([character, morse]) => [morse, character]),
)
```

Backend:

```py
@lru_cache(maxsize=1)
def load_reverse_morse_map() -> dict[str, str]:
    return {morse: character for character, morse in load_morse_map().items()}
```

What it stores:

- Morse token -> decoded character

Why I chose it:

- decode lookups become simple dictionary/object reads
- it avoids keeping two separate source files in sync

Tradeoff:

- there is a tiny amount of startup work to build the reverse table, but it is negligible here

### Translation warning

Frontend shape:

```ts
export interface TranslationWarning {
  code: WarningCode
  message: string
  items: string[]
}
```

Backend shape:

```py
class TranslationWarning(BaseModel):
    code: Literal[
        "EMPTY_INPUT",
        "INVALID_MORSE_CHARACTERS",
        "UNKNOWN_MORSE_TOKENS",
        "UNSUPPORTED_TEXT_CHARACTERS",
    ]
    message: str
    items: list[str] = Field(default_factory=list)
```

What it stores:

- a stable machine-friendly warning code
- a readable warning message
- example items related to that warning

Why I chose it:

- the UI does not need to parse strings to understand warning types
- tests can assert on stable codes
- the structure is small enough to keep frontend and backend behavior aligned

### Translation result object

Frontend utility return shape:

```ts
export interface TranslationResult {
  output: string
  warnings: TranslationWarning[]
}
```

What it stores:

- translated output
- all warnings collected during translation

Why I chose it:

- every translation call returns one consistent object
- it keeps output and warning generation tied together

Tradeoff:

- the frontend utility result does not include the original input or mode because that data is already in component state

### History item shape

Frontend shape:

```ts
export interface HistoryItem {
  id: string
  mode: TranslationMode
  input: string
  output: string
  timestamp: string
}
```

What it stores:

- a unique id for rendering
- the mode used for that translation
- the original input
- the output shown at save time
- the timestamp

Why I chose it:

- a history item is self-contained and easy to display
- it gives me enough data to show previews and restore past work
- it stays small enough for `localStorage`

Tradeoff:

- I do not store warnings in history, so clicking a history item reruns translation to regenerate them

### Frontend state shape

Conceptually, the main React state looks like this:

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

What it stores:

- current mode
- current textarea input
- most recent output
- current warnings
- transient clipboard status text
- loaded history items

Why I chose it:

- it matches the UI directly
- it keeps derived UI state explicit
- it is easy to reset pieces of state when mode or actions change

### API request and response models

Request model:

```py
class TranslationRequest(BaseModel):
    input: str = ""
```

Response model:

```py
class TranslationResponse(BaseModel):
    mode: Literal["decode", "encode"]
    input: str
    output: str
    warnings: list[TranslationWarning] = Field(default_factory=list)
```

What they store:

- the raw input text
- the mode the endpoint handled
- the translated output
- structured warnings

Why I chose them:

- the response is self-describing
- the API response shape is explicit and easy to test
- the default empty string request path lets the backend reuse the same validation logic for missing or empty input

## 10. API Endpoints

I kept the backend API intentionally small. The application endpoints are just the two translation routes, and FastAPI also provides its normal docs/schema routes.

### `POST /decode`

Purpose:

- I use this endpoint to translate Morse code into uppercase text.

Request body:

```json
{
  "input": ".... . .-.. .-.. ---"
}
```

Response body:

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
curl -X POST http://127.0.0.1:8000/decode \
  -H "Content-Type: application/json" \
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

Possible warnings:

- `EMPTY_INPUT`
- `INVALID_MORSE_CHARACTERS`
- `UNKNOWN_MORSE_TOKENS`

### `POST /encode`

Purpose:

- I use this endpoint to translate plain text into Morse code.

Request body:

```json
{
  "input": "HEY JUDE"
}
```

Response body:

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
curl -X POST http://127.0.0.1:8000/encode \
  -H "Content-Type: application/json" \
  -d "{\"input\":\"HI %\"}"
```

Example response:

```json
{
  "mode": "encode",
  "input": "HI %",
  "output": ".... ..   ?",
  "warnings": [
    {
      "code": "UNSUPPORTED_TEXT_CHARACTERS",
      "message": "Encoded 1 unsupported character as ?.",
      "items": ["%"]
    }
  ]
}
```

Possible warnings:

- `EMPTY_INPUT`
- `UNSUPPORTED_TEXT_CHARACTERS`

### FastAPI helper routes

FastAPI also exposes:

- `GET /docs` for Swagger UI
- `GET /openapi.json` for the generated OpenAPI schema

I did not add a custom health route because the assignment did not need one.

## 11. Frontend State and UI Model

I built the frontend around a small set of React state values in `frontend/src/App.tsx`.

### Important state

- `mode`
  Either `decode` or `encode`.

- `input`
  The raw textarea value.

- `output`
  The last translated result.

- `warnings`
  The current structured warnings returned by the translator utility.

- `copyMessage`
  Short status text after the user tries to copy output.

- `history`
  The current loaded translation history from `localStorage`.

### UI behavior tied to state

- The screen has one translator card and one history sidebar.
- I only run translation when the user clicks `Decode` or `Encode`, not on every keystroke.
- When the user switches modes, I keep the current input but clear the old output, warnings, and copy status so the screen does not show stale results.
- The `Copy Output` button is disabled when there is no output.
- If clipboard copy succeeds, I show `Copied to clipboard.`.
- If clipboard access fails, I show `Clipboard copy is unavailable in this browser.`.
- The warning panel shows one of three states:
  - warning list when warnings exist
  - clean success message when output exists with no warnings
  - placeholder note before the user translates anything

### Why I modeled the UI this way

I wanted the component state to line up directly with what the user sees. That made the update flow predictable and made it easy to reset only the parts of the UI that should actually change.

## 12. History Persistence

I used `localStorage` instead of a database because history is purely local in this project.

### What I save

I save an array of `HistoryItem` objects under the key:

```text
morse-translator-history
```

Each item stores:

- `id`
- `mode`
- `input`
- `output`
- `timestamp`

### How it works

- I lazy-load history when the app initializes.
- If `localStorage` is missing, malformed, or contains the wrong shape, I fall back to an empty history list.
- I save history only after a non-empty translation action.
- I cap history at 12 items.
- I remove exact duplicates based on `mode`, `input`, and `output`.
- I keep the newest matching item at the front.

### Clicking a history item

When the user clicks a history item, I do not blindly trust the stored output. I restore the saved mode and input, rerun translation, and then show the current output and warnings again.

I chose that because it keeps the UI aligned with the current translation logic, even if the code changes later.

### Clear history

The `Clear History` button removes the `localStorage` key entirely and resets the sidebar to an empty state.

### Tradeoffs

Why this approach works well here:

- no backend persistence needed
- no user accounts needed
- no schema or migration work needed
- the hosted app stays self-contained

What it does not do:

- it does not sync across browsers or devices
- it is easy for a user to clear accidentally by wiping browser storage
- it is not suitable if history ever needs to be shared or audited across users

## 13. Testing

I treated testing as a check on the actual translation rules, not just a checkbox on the assignment.

### Backend tests

I used `pytest` to cover the Python translation functions and the FastAPI endpoints.

The backend tests cover:

- decode sample cases
- encode sample cases
- one-space and two-space letter splitting
- newline handling as word breaks
- unknown Morse tokens
- invalid Morse characters
- empty input warnings
- unsupported encode characters
- API smoke tests for `/decode` and `/encode`

#### Decode sample cases in tests

| Input | Expected output |
| --- | --- |
| `.... . .-.. .-.. ---` | `HELLO` |
| `.... . .-.. .-.. ---   .-- --- .-. .-.. -..` | `HELLO WORLD` |
| `... --- ...` | `SOS` |
| `.... . -.--   .--- ..- -.. .` | `HEY JUDE` |

#### Encode sample cases in tests

| Input | Expected output |
| --- | --- |
| `HELLO` | `.... . .-.. .-.. ---` |
| `HEY JUDE` | `.... . -.--   .--- ..- -.. .` |
| `SOS` | `... --- ...` |

#### Special backend test cases

- `....  . -.--\n.--- ..- -.. .` -> `HEY JUDE`
- `.... ..-.- ..x` -> `H??` with both invalid-token and unknown-token warnings
- whitespace-only input -> empty output with `EMPTY_INPUT`
- text with an unsupported character -> `?` plus `UNSUPPORTED_TEXT_CHARACTERS`

### Frontend tests

I used Vitest to test the translation utilities in `frontend/src/utils/translator.ts`.

The frontend tests cover:

- the main decode sample cases
- decode spacing behavior
- decode warnings for invalid and unknown Morse tokens
- encode word spacing
- encode fallback behavior for unsupported characters

The frontend tests are utility-level tests, not rendered component tests. I made that tradeoff because the core risk in this app is the translation logic itself, and that logic already lives in pure functions.

### Why these cases matter

- The sample cases prove the app handles the basic assignment examples.
- The spacing tests prove that one space, two spaces, three spaces, and newlines behave the way I documented.
- The warning tests prove I am not silently dropping bad input.
- The API tests prove the FastAPI wiring returns the same behavior as the pure translator functions.

### Test commands

From the repo root:

```bash
pytest backend/tests
npm --prefix frontend run test
```

## 14. Edge Cases Handled

I explicitly handled these edge cases:

- blank input
- leading and trailing whitespace
- one space vs two spaces between Morse letters
- three or more spaces between Morse words
- Windows newlines and Unix newlines
- multiple newlines between words
- unknown Morse tokens
- invalid characters inside Morse tokens
- unsupported characters in encode mode
- lowercase text in encode mode
- corrupted or malformed `localStorage` history
- exact repeated history entries
- copy attempts when there is no output

## 15. Tradeoffs and Design Decisions

### Frontend translation for live deployment

I put real translation logic in the frontend because the deployed app lives on Firebase Hosting, which serves static files. That means the live site can still work end to end without a backend service running somewhere else.

### Backend included for API demonstration

I still built the FastAPI backend because I wanted to show a local API version, typed schemas, backend validation, and Python testing. In other words, the backend is real, but it is not part of the Firebase-hosted production path in this repo.

### Shared map, mirrored logic

I shared the Morse map directly, but I mirrored the translation algorithm in TypeScript and Python instead of trying to force a single cross-language implementation. That keeps the code readable, but it does mean there is some manual alignment risk. I reduced that risk by keeping the rules simple and covering them in tests on both sides.

### localStorage instead of a database

I chose `localStorage` because it matched the scope of the feature. History is local, small, and not security-sensitive. Adding a database would have made setup, deployment, and review heavier without really improving the assignment.

### Capped history size

I capped history at 12 items so the sidebar stays useful instead of turning into a long scroll of old translations. For this app, recent history matters more than permanent history.

### Graceful warnings instead of hard failures

I chose to surface warnings and keep going because translation tools are more useful when they show partial results. A single bad token should not prevent the user from seeing the rest of the decoded message.

### Simple data structures

I kept the main data structures plain: objects, arrays, and small typed models. I did not need reducers, global state, or database-style models for this size of app.

### Explicit translate action

I used a button-driven translation flow instead of translating on every keystroke. That keeps the UX stable, avoids noisy intermediate history updates, and makes the output/warning state transitions easier to follow.

## 16. Local Development

I kept local setup simple. There are no environment variables and no secrets required.

### Frontend

Install dependencies:

```bash
npm --prefix frontend install
```

Run the Vite dev server:

```bash
npm --prefix frontend run dev
```

The frontend runs on:

```text
http://localhost:5173
```

### Backend

Install backend dependencies:

```bash
python -m pip install -r backend/requirements-dev.txt
```

Run the FastAPI app:

```bash
python -m uvicorn backend.app.main:app --reload
```

The backend runs on:

```text
http://127.0.0.1:8000
```

FastAPI docs are available at:

```text
http://127.0.0.1:8000/docs
```

### Running tests

Backend:

```bash
pytest backend/tests
```

Frontend:

```bash
npm --prefix frontend run test
```

### Build the frontend locally

```bash
npm --prefix frontend run build
```

### Environment assumptions

I assume:

- `npm` is installed
- a modern Python 3 environment is installed
- `pip` is available
- Firebase CLI is installed only if I want to deploy

## 17. Deployment

I configured deployment only for the frontend.

### Firebase Hosting setup

- `.firebaserc` points to the Firebase project `morse-code-34b27`.
- `firebase.json` serves the `frontend/dist` folder.
- `firebase.json` rewrites all routes to `index.html` so the React app works as a single-page app.

### What gets deployed

- the built frontend files in `frontend/dist`

### What does not get deployed

- the FastAPI backend
- backend tests
- Python dependencies
- any server runtime

### Build and deploy steps

Build the frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run build
```

Deploy to Firebase Hosting:

```bash
firebase deploy --only hosting
```

If Firebase CLI is not installed yet:

```bash
npm install -g firebase-tools
firebase login
```

### How live deployment differs from local development

Locally, I can run both the React frontend and the FastAPI backend side by side.

In the live Firebase deployment:

- the frontend still works fully
- translation happens in the browser
- history still works through `localStorage`
- the Python backend is not running

## 18. Security / Safety Notes

This project is small, but I still kept the safety model simple and predictable.

- I do not need any secrets or API keys.
- I do not use authentication.
- I treat all user input as plain text.
- I do not render user input as HTML.
- I do not use `dangerouslySetInnerHTML`.
- I do not store history on a server.
- I keep history local to the browser through `localStorage`.
- I do not execute user input in any way.
- I handle bad input through warnings and fallback markers instead of risky parsing shortcuts.

## 19. Future Improvements

If I kept working on this project, these are the next improvements I would make:

- deploy the FastAPI backend separately so the frontend can optionally call a live API
- generate both frontend and backend logic from one shared source of truth to reduce drift
- add component tests or browser-based end-to-end tests
- improve accessibility details like keyboard shortcuts and more explicit focus states
- add richer history controls such as delete-one-item and export/import
- add more test coverage around the history helpers
- make the live app able to switch between local translation and API translation

## 20. Submission Summary

I built a Morse translator that supports both decode and encode flows, shows structured validation warnings, saves recent history locally, includes a tested FastAPI API version, and deploys cleanly as a static frontend on Firebase Hosting.

The frontend is the real deployed runtime. The backend is the matching local/API version. I kept the code small on purpose, but I documented the parsing rules, warning behavior, data flow, and tradeoffs so a reviewer can understand the project without reading every file first.
