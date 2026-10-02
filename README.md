# Mini CRM — Frontend

React 19 + TypeScript SPA for the Mini CRM lead-management project. Pairs with the Laravel API in [minicrm-uz/crm-back](https://github.com/minicrm-uz/crm-back).

Stack: **Vite 8**, **React 19**, **TypeScript**, **TailwindCSS v4**, **React Router v7**, **React Query v5**, **Axios**.

## Quick start

```bash
cp .env.example .env
# Edit VITE_API_URL if the backend isn't on http://localhost:8000
npm install
npm run dev
```

Dev server runs on http://localhost:5173.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Auth flow

- `POST /api/auth/login` and `/register` return `{ user, access, refresh }`.
- **Access token** (short-lived JWT) is kept in **memory only** (`src/auth/tokenStore.ts`). A page reload clears it on purpose — this limits the blast radius of XSS and forces the app to run a refresh.
- **Refresh token** (long-lived, server-side rotation) is stored in **localStorage**. This survives reloads but is XSS-readable. See the inline note in `tokenStore.ts` for the production hardening path (httpOnly cookie + CSRF).
- The axios response interceptor (`src/api/client.ts`) catches a 401, calls `/api/auth/refresh`, and transparently retries the original request. Concurrent 401s share one refresh via a `refreshInFlight` promise so N parallel requests don't each burn a refresh token.

## Folder layout

```
src/
├── api/           Axios instance + typed API wrappers
├── auth/          AuthProvider + token store + useAuth hook
├── components/    ProtectedRoute (route-level auth gate)
├── lib/           Shared types (mirrors the Laravel resources) + error helpers
├── pages/         Login, Register, Dashboard (placeholder), 404
├── App.tsx        Routes + providers
└── main.tsx       Vite entry
```

## Roadmap

- [x] Day 5 — Scaffold + auth (login, register, protected routes, logout)
- [ ] Day 6 — Leads list (search/filter/sort/pagination), detail + edit, dashboard charts, toasts
- [ ] Day 7 — Polish + docs
