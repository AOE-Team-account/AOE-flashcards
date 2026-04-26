# AOE flashcards – Node.js + Express starter

This starter keeps your existing flashcards web app and adds a simple Express backend for:

- sign up
- log in
- save decks/settings/language to the server
- load the same data on another device

## Important

This starter uses a JSON file (`data/store.json`) instead of a real database so it stays simple.
It works for learning and small tests.
For production, move to PostgreSQL or another real database.

## 1. Install

```bash
npm install
```

## 2. Start backend

```bash
npm start
```

Backend runs on:

```text
http://localhost:3000
```

## 3. Open the app

Because the backend also serves the frontend files, the easiest local test is:

```text
http://localhost:3000/index.html
```

## 4. For GitHub Pages / deployed frontend

In `index.html`, find this line:

```js
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? 'http://localhost:3000/api'
  : 'https://YOUR-BACKEND-DOMAIN/api';
```

Replace `https://YOUR-BACKEND-DOMAIN/api` with your real backend domain.

Example:

```js
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? 'http://localhost:3000/api'
  : 'https://api.example.com/api';
```

## 5. Files

- `server.js` – Express backend
- `data/store.json` – user accounts + synced app data
- `index.html` – your app with cloud login/sync controls in Settings

## 6. Environment variables for production

Set these on your server:

- `PORT`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

Example:

```bash
JWT_SECRET=replace-me
FRONTEND_ORIGIN=https://yourname.github.io
```

## 7. What syncs

- decks
- study progress
- settings
- interface language

## 8. Notes

- local device saving still works
- when logged in, changes also sync to the backend
- login section appears inside Settings
