# Morse Translator

Morse Translator is a React + Vite + TypeScript app that converts Morse code to uppercase text and encodes plain text back into Morse. The app is deployed as a static frontend on Firebase Hosting, so the full user experience runs in the browser.

## Live Demo

- Primary URL: [https://morse-code-34b27.web.app](https://morse-code-34b27.web.app)
- Alternate URL: [https://morse-code-34b27.firebaseapp.com](https://morse-code-34b27.firebaseapp.com)

## Features

- Decode mode for Morse to text
- Encode mode for text to Morse
- Structured warnings for malformed spacing, unknown tokens, and unsupported characters
- Recent translation history saved in `localStorage`
- Copy output support
- Frontend utility tests with Vitest

## Tech Stack

- React
- Vite
- TypeScript
- Firebase Hosting
- Vitest

## Project Structure

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
|-- shared/
|   `-- morse-map.json
|-- .firebaserc
|-- firebase.json
`-- README.md
```

## How It Works

- The UI lets the user switch between decode and encode modes.
- Translation runs in the frontend using the shared Morse map in `shared/morse-map.json`.
- Warnings are shown alongside the output instead of failing the whole translation.
- Recent translations are stored in `localStorage` so they survive refreshes.

## Local Development

Install dependencies:

```bash
npm --prefix frontend install
```

Run the development server:

```bash
npm --prefix frontend run dev
```

The app runs at:

```text
http://localhost:5173
```

## Testing

Run frontend tests:

```bash
npm --prefix frontend run test
```

## Build

Create the production build:

```bash
npm --prefix frontend run build
```

The build output is written to:

```text
frontend/dist
```

## Deployment

Firebase Hosting serves the built static frontend from `frontend/dist`. The Firebase config rewrites all routes to `index.html` so the app works as a single-page application.

Build and deploy:

```bash
npm --prefix frontend run build
firebase deploy --only hosting
```
