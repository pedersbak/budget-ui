# Budget UI

Budget UI is the responsive React frontend for the household Budget API. It was created from the Iris UI template and retains its application shell, accessible components, themes, localization, authentication boundary, test setup, and production container.

## Features

- Login, registration, session restoration, five-minute access-token refresh, and logout against the Budget API
- User-owned budget list, creation, editing, and deletion
- Recurring-payment CRUD grouped into collapsible categories
- Budget-account and daily-account payments with monthly, quarterly, half-yearly, annual, or explicit-month schedules
- Explicit budget rebalancing and a responsive 12-month projection
- Danish and English interfaces plus all four Iris themes
- Loading, empty, error, inactive-payment, and rebalance-required states
- Mobile navigation and card-style responsive tables

The financial calculations remain authoritative in the backend. The UI reconstructs a previously saved projection for display using the backend's calendar rules, but only `POST /budgets/{id}/rebalance` calculates and persists a new transfer suggestion.

## Run locally

Start the API on port 8080, then:

```sh
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:4173>. Set `VITE_API_URL` if the API is served elsewhere.

## Checks

```sh
npm test
npm run build
npm run build:library
docker compose config
```

## Docker

```sh
docker compose up --build
```

The app is served at <http://localhost:4173>, with `/healthz` available for container health checks. `VITE_API_URL` is a build-time setting because Vite compiles it into the browser bundle.

## Structure

```text
src/budget/    Budget application, API client, auth mapping, pages and tests
src/template/  Product-neutral Iris shell and reusable components
src/demo/      Original template reference app (not used by the production entry point)
```

See [AGENTS.md](AGENTS.md) for the inherited Iris architectural and verification rules.
