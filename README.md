# Mini CRM — Frontend

React 19 + TypeScript SPA for the Mini CRM lead-management project. Pairs with the Laravel API in [minicrm-uz/crm-back](https://github.com/minicrm-uz/crm-back).

**Stack:** Vite 8 · React 19 · TypeScript · TailwindCSS v4 · React Router v7 · React Query v5 · Axios · recharts · sonner

> See [crm-back/docs/ARCHITECTURE.md](https://github.com/minicrm-uz/crm-back/blob/main/docs/ARCHITECTURE.md) for the full auth-flow sequence diagrams, data model, and project-wide decision log. The frontend-only decisions are summarised below.

## Quick start

```bash
cp .env.example .env
# Edit VITE_API_URL if the backend isn't on http://localhost:8000
npm install
npm run dev
```

Dev server on **http://localhost:5173**. Sign in with the seeded user `demo@example.com` / `password` from the backend seeder.

## Scripts

| Script           | Purpose                                              |
|------------------|------------------------------------------------------|
| `npm run dev`    | Vite dev server with HMR                             |
| `npm run build`  | Type-check + production build to `dist/`             |
| `npm run preview`| Serve the production build locally                   |
| `npm run lint`   | Lint with oxlint (0 warnings expected)               |

## Features

- **Auth** — register, login, auto-refresh on 401, "log out of all devices" via the backend's `/auth/logout`.
- **Dashboard** — 4 stat cards (total, won rate, this week, this month) and 2 recharts bar charts (status, source). Powered by `GET /api/dashboard/stats`.
- **Leads list** — table with name/phone/email/source/status/created. 350 ms debounced substring search, dropdown filters for status + source, click-to-sort column headers (↑/↓), prev/next pagination, URL-synced filters so refresh and back preserve the view.
- **New lead** — modal with per-field validation errors from the API. On save, invalidates both the list and the dashboard stats query.
- **Lead detail** — editable form (name/phone/email/source/note), separate status dropdown (hits `PATCH /leads/{id}/status` so the audit log records a `status_changed` row, not a generic `updated`), soft delete with confirm, right-rail activity timeline with before→after diffs.
- **Toasts** — sonner surfaces API errors and "session expired" after a failed silent refresh.

## Auth storage tradeoff

- **Access token** (short-lived JWT) lives in **memory only** (`src/auth/tokenStore.ts`). A page reload clears it on purpose — this limits the blast radius of XSS and forces the app to run a refresh instead of trusting a persisted token.
- **Refresh token** (long-lived, server-rotated) is stored in **localStorage**. This survives reloads but is XSS-readable. The production hardening path is an `httpOnly` + `SameSite=Strict` cookie plus a CSRF token on `/auth/refresh`; the inline note in `tokenStore.ts` documents this.
- The axios response interceptor (`src/api/client.ts`) catches a 401, calls `/api/auth/refresh`, and transparently retries the original request. Concurrent 401s share **one** refresh via a `refreshInFlight` promise so N parallel requests don't each burn a refresh token.

## Folder layout

```
src/
├── api/                 Axios instance + typed API wrappers (auth, leads, dashboard)
├── auth/                AuthProvider + authContext (createContext) + useAuth + tokenStore
├── components/          AppShell, ProtectedRoute, NewLeadModal
├── lib/                 types (mirrors Laravel resources), constants (enum lists, status
│                        badge class map), errors (API error extractor), useDebouncedValue
├── pages/               Login, Register, Dashboard, Leads, LeadDetail, NotFound
├── App.tsx              Router + QueryClientProvider + AuthProvider + Toaster
└── main.tsx             Vite entry
```

## Frontend-only decisions

- **URL = source of truth** for the leads-list filters (`useSearchParams`). Back button, bookmarks, and refresh all preserve the view.
- **350 ms `useDebouncedValue`** on the search input instead of debouncing the query key — keeps typing responsive, URL and query only update once per burst.
- **`<EditLeadForm key={lead.id} />`** so lazy `useState(() => lead.field)` seeds the form once per lead. Avoids the common `useEffect` pattern that would clobber user edits on refetch, and keeps oxlint `react/set-state-in-effect` quiet.
- **Mutations invalidate the full dependency graph** (leads list + dashboard stats where applicable) instead of hand-updating caches. `setQueryData` is used only for the detail cache after an edit so the detail view flashes-free.
- **recharts for charts** — component-first API that matches the React mental model; bundle cost comparable to Chart.js once gzipped.
- **sonner for toasts** — smallest API surface, modern defaults, one `<Toaster />` at the root is all the boilerplate it needs.

## Roadmap

- [x] Day 5 — Scaffold + auth (login, register, protected routes, logout)
- [x] Day 6 — Leads list (search/filter/sort/pagination), create modal, detail + edit, status endpoint, activity timeline, dashboard with charts, toasts
- [x] Day 7 — Polish + docs
