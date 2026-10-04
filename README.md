# Iris UI

Iris UI is a product-neutral React application template extracted from the proven interaction and layout patterns in `diktat-ui`. It is both a runnable demo and a reusable component library. The demo intentionally uses generic workspace data so future applications can provide their own domain models without inheriting gaming terminology.

Codex agents working in this repository must also follow [`AGENTS.md`](AGENTS.md), which documents the architectural boundaries, extension workflow and required verification.

## Included

- Responsive application shell with desktop navigation, mobile drawer and bottom navigation
- Configuration-driven menus with authenticated, admin and superadmin visibility
- Login, registration, session restoration, logout and protected routes
- Replaceable authentication adapters, including a fetch-based HTTP adapter
- English/Danish UI switching with fallback interpolation
- Four selectable, persisted themes: Electric, Professional, Blossom and Obsidian
- Buttons, badges, cards, tiles, inputs, selects, text areas, alerts, progress bars and modals
- Loading, empty, error and not-authorized states
- Responsive dashboard metrics and data tables
- Contact/support form, workspace page, admin dashboard and superadmin user management demo
- Vite development/build setup and production Nginx Docker image with SPA routing and health check
- Library build with TypeScript declarations

## Run locally

```sh
npm install
npm run dev
```

Open <http://localhost:4173>. Any email/password signs into the local demo. An email starting with `admin` receives the admin role; one starting with `super` receives the superadmin role. The login page also has role shortcuts.

Production and library checks:

```sh
npm test
npm run build
npm run build:library
```

## Run with Docker

```sh
docker compose up --build
```

The application is served at <http://localhost:4173>; the container health endpoint is `/healthz`. Change `VITE_API_URL` in `.env` or as a Docker build argument when wiring a backend.

## Use as an application template

1. Replace `brand` and `navigation` in `src/demo/DemoApp.tsx`.
2. Replace the demo page components with domain pages while keeping `AppShell` and route guards.
3. Supply translations to `TemplateProvider`.
4. Replace `demoAuthAdapter` with `createHttpAuthAdapter(...)` or your own `AuthAdapter`.
5. Keep the theme tokens in `src/styles.css`, adjusting values instead of component CSS.

Example production auth setup:

```tsx
const auth = createHttpAuthAdapter({
  baseUrl: import.meta.env.VITE_API_URL,
  endpoints: {
    login: '/Auth/login',
    register: '/Auth/register',
    refresh: '/Auth/refreshtoken',
    logout: '/Auth/logout',
  },
  mapSession: mapYourApiResponse,
});

<TemplateProvider authAdapter={auth} messages={messages}>
  <App />
</TemplateProvider>
```

The adapter boundary deliberately does not prescribe a token schema. `mapSession` converts an API response into `{ user, accessToken, refreshToken? }`. For security-sensitive production deployments, consider adapting storage to an HTTP-only cookie flow instead of local storage.

## Library usage

```tsx
import { AppShell, Badge, Button, Card, TemplateProvider } from 'iris-ui';
import 'iris-ui/styles.css';
```

Public reusable code lives in `src/template`; `src/demo` is only a reference consumer. The older network-visualization exports remain available for compatibility.

## Architecture

| Area | Extension point |
| --- | --- |
| Branding and shell | `AppBrand`, `NavItem[]`, `AppShell` slots |
| Authentication | `AuthAdapter`, `createHttpAuthAdapter`, `RouteGuard` |
| Authorization | `Role`, `minimumRole`, `hasRole` |
| Localization | `messages`, `Locale`, `useTemplate().t` |
| Theme | CSS custom properties and `ThemeId` |
| Domain views | Compose `Card`, `Tile`, `DataTable`, states and forms |
| Backend data | Keep fetching/query logic in the consuming application |

See [the reconstruction audit](docs/diktat-reconstruction-audit.md) for the reference-to-template mapping and the small set of intentionally domain-specific pieces that remain application code.
