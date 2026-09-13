# Fitness App

Personal 12-week workout, nutrition, and schedule tracker. Vite + React, no backend — workout progress and post-workout notes persist in the browser's `localStorage`.

## Run

```bash
npm install
npm run dev
```

## Status

- Only Day 1 (Monday) is filled in; Tuesday–Sunday need their own exercise/cardio data in `src/App.jsx`.
- Progress (checked sets, notes) is scoped per-browser via `localStorage` — clearing site data resets it.
