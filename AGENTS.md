# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

YouTube Search & Downloader app — Angular 21 frontend + NestJS 11 backend. Uses `yt-dlp` + `ffmpeg` for downloading.

### Services

| Service | Port | Dev Command |
|---------|------|-------------|
| Backend (NestJS) | 3000 | `cd backend && npm run start:dev` |
| Frontend (Angular) | 4200 | `cd frontend && npx ng serve --proxy-config proxy.conf.json --host 0.0.0.0` |

### Important Notes

- **Proxy config**: The frontend uses relative API URLs (`/api/...`). For local dev, the Angular dev server must be started with `--proxy-config proxy.conf.json` to forward `/api/*` requests to the backend on port 3000. The `proxy.conf.json` file is in the `frontend/` directory.
- **Environment variables**: A `.env` file at the repo root must contain `YOUTUBE_API_KEY`. The backend loads it via `ConfigModule` with `envFilePath: '../.env'` (relative to `backend/`).
- **System dependencies**: `yt-dlp` and `ffmpeg` must be on PATH. `ffmpeg` is pre-installed; `yt-dlp` is installed via `pip install yt-dlp` (binary at `~/.local/bin/yt-dlp`).
- **No database**: The backend is stateless. Downloaded files are stored on disk, download history is in browser localStorage.
- **Lint**: Backend lint has many pre-existing errors (mostly `@typescript-eslint/no-unsafe-*` and `prettier` formatting). Frontend ESLint is not properly configured (legacy config format in `eslint.config.js` with missing Angular ESLint plugins).
- **Tests**: Backend has no test files. Frontend uses Karma (headless Chrome needed for `npm test`).
- **Build**: `cd backend && npm run build` and `cd frontend && npx ng build` both succeed.
- **Swagger docs**: Available at `http://localhost:3000/api/docs` when backend is running.
