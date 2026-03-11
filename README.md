# Morse Translator

I built this project as a frontend Morse code translator that works entirely in the browser. I implemented two translation paths:

- Morse code to uppercase text
- Plain text to Morse code

I also implemented validation warnings, local translation history, copy-to-clipboard support, automated tests for the translation logic, and static deployment through Firebase Hosting.

## Live Demo

- Primary URL: [https://morse-code-34b27.web.app](https://morse-code-34b27.web.app)
- Alternate URL: [https://morse-code-34b27.firebaseapp.com](https://morse-code-34b27.firebaseapp.com)

## What I Built

I built a React + Vite + TypeScript single-page application that lets a user:

- Decode Morse code into uppercase text
- Encode text back into Morse code
- See warnings for malformed Morse spacing, invalid Morse characters, unknown Morse tokens, and unsupported text characters
- Copy the translated output
- Reopen recent translations from local history
- Use the app without any backend or database

The full experience runs client-side. I chose that on purpose because the problem is deterministic, the translation logic is small, and there is no reason to introduce server complexity for a tool like this.

## My Plan

When I approached this project, I broke it into a few clear parts:

1. Implement a reliable Morse translation layer first.
2. Define the exact spacing and validation rules so the app behaves predictably.
3. Build a simple UI around those rules instead of mixing translation logic into the components.
4. Add persistence with `localStorage` so the app feels more complete without needing a backend.
5. Add tests around the translator because that is the part most likely to cause correctness issues.
6. Deploy it as a static site so the finished project is easy to review.

That plan influenced the architecture directly: translation logic lives in utility files, UI components stay focused on rendering and interaction, and persistence is handled separately.

## Architecture

At a high level, I split the project into three layers:

### 1. Presentation layer

This is the React UI.

- `App.tsx` coordinates application state
- `TranslatorCard.tsx` renders the translator interface
- `HistorySidebar.tsx` renders recent translations

### 2. Domain logic layer

This is where the actual translation rules live.

- `morseMap.ts` defines the Morse mapping and reverse mapping
- `translator.ts` handles encoding, decoding, normalization, token parsing, and warning generation
- `types.ts` defines shared TypeScript types for modes, warnings, history items, and translation results

### 3. Persistence layer

This is intentionally lightweight.

- `history.ts` loads, validates, saves, formats, and clears translation history from `localStorage`

I kept these responsibilities separate so the app is easier to test and easier to explain.

## How the App Works

### Decode flow

When I decode Morse input, I do the following:

1. Normalize line endings and trim surrounding whitespace.
2. Treat new lines as word breaks.
3. Parse the input using explicit Morse spacing rules:
   - `1` space separates letters
   - `3` spaces separate words
   - any other spacing is treated as malformed input
4. Decode each token using the reverse Morse map.
5. Replace invalid or unknown values with `?` instead of failing the full translation.
6. Return both the translated output and structured warnings.

### Encode flow

When I encode plain text, I do the following:

1. Normalize line endings and trim surrounding whitespace.
2. Collapse whitespace between words.
3. Convert letters to uppercase.
4. Encode each supported character using the Morse map.
5. Replace unsupported characters with `?`.
6. Separate letters with single spaces and words with triple spaces.
7. Return both the encoded output and any warnings.

## Validation Rules I Implemented

I wanted the app to be forgiving enough to keep working, but strict enough to explain bad input clearly.

### Decode mode warnings

- `EMPTY_INPUT`
- `INVALID_MORSE_SPACING`
- `INVALID_MORSE_CHARACTERS`
- `UNKNOWN_MORSE_TOKENS`

### Encode mode warnings

- `EMPTY_INPUT`
- `UNSUPPORTED_TEXT_CHARACTERS`

Instead of rejecting the whole translation, I surface warnings and keep the output usable. That makes the tool more practical and also makes the internal behavior easier to reason about.

## State Management and Data Flow

I kept state local to the app because the project is small and does not need a global state library.

`App.tsx` owns:

- current mode
- current input
- current output
- current warnings
- copy status message
- translation history

The flow is:

1. The user edits input or changes mode in the UI.
2. `App.tsx` calls the translation utility.
3. The utility returns `{ output, warnings }`.
4. `App.tsx` updates the UI state.
5. If the input is non-empty, I create a history item and persist it to `localStorage`.
6. The sidebar can load a previous item back into the main translator view.

## Why I Chose `localStorage`

I used `localStorage` because it matches the scope of the project well:

- no authentication is required
- no cross-device sync is needed
- the history is small and personal to the browser session
- it keeps deployment simple because there is no backend

I also added validation when reading stored history so corrupted or unexpected data does not break the app.

## Testing

I wrote Vitest tests around the translation utilities because that is the core correctness layer.

The tests cover:

- normal decoding
- normal encoding
- word separation rules
- newline handling
- leading and trailing whitespace
- invalid Morse spacing
- invalid Morse characters
- unknown Morse tokens
- unsupported text characters
- repeated invalid inputs and warning counts

I focused tests on the translator instead of the UI first because the translator contains the rules that matter most.

## Project Structure

```text
.
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- HistorySidebar.tsx
|   |   |   `-- TranslatorCard.tsx
|   |   |-- utils/
|   |   |   |-- history.ts
|   |   |   |-- morseMap.ts
|   |   |   |-- translator.test.ts
|   |   |   `-- translator.ts
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   |-- style.css
|   |   `-- types.ts
|   |-- index.html
|   |-- package.json
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- .firebaserc
|-- firebase.json
`-- README.md
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- Firebase Hosting

## Local Development

Install dependencies:

```bash
npm --prefix frontend install
```

Start the development server:

```bash
npm --prefix frontend run dev
```

The app runs at:

```text
http://localhost:5173
```

## Running Tests

```bash
npm --prefix frontend run test
```

## Production Build

```bash
npm --prefix frontend run build
```

The production output is generated in:

```text
frontend/dist
```

## Deployment

I deployed the app to Firebase Hosting as a static frontend. That fits the architecture because the project does not require server-side logic.

To deploy:

```bash
npm --prefix frontend run build
firebase deploy --only hosting
```

## Tradeoffs and Design Decisions

There are a few deliberate tradeoffs in this implementation:

- I used a static map instead of a more abstract encoding system because the mapping is fixed and clarity matters more than extensibility here.
- I used local component state instead of Redux, Zustand, or Context because the state is small and localized.
- I returned warnings alongside results instead of throwing errors because partial translation is a better user experience for malformed input.
- I used `localStorage` instead of a backend because persistence was useful, but remote storage was unnecessary.
- I tested the utility layer first because correctness in translation rules matters more than UI polish.

## What I Would Improve Next

If I kept extending this project, I would likely add:

- audio playback for Morse output
- support for a larger punctuation set
- keyboard shortcuts for translate, clear, and copy
- stronger accessibility testing and ARIA refinement
- component-level UI tests
- an option to export translation history
- a small parser visualizer that shows how Morse input is tokenized

## What I Learned

This project was a good exercise in keeping a small application disciplined. I implemented a very simple product, but I still treated it like a real engineering problem:

- define rules clearly
- separate UI from logic
- validate persisted data
- test the behavior that matters most
- keep deployment aligned with the actual needs of the app

That was the main goal of the architecture: not complexity, but clarity.
