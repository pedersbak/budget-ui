# Diktat reconstruction audit

This audit checks whether the current `diktat-ui` could be rebuilt on Iris UI without changing its product behavior. It compares the reference application to the abstractions exposed by `src/template`; it does not attempt a second implementation of Diktat.

## Coverage matrix

| Diktat capability | Iris UI replacement | Result |
| --- | --- | --- |
| Sticky desktop header and account menu | `AppShell`, `PreferenceMenu`, configuration-driven `NavItem[]` | Covered |
| Mobile drawer and fixed bottom navigation | Responsive `AppShell` navigation | Covered |
| Public, authenticated, admin and superadmin routes | `RouteGuard`, `Role`, `minimumRole`, `hasRole` | Covered |
| Login, registration, restore and logout | `TemplateProvider` plus `AuthAdapter` | Covered |
| API-backed token authentication | `createHttpAuthAdapter` with endpoint and response mapping | Covered; Diktat supplies its response mapper |
| Danish and English UI | `messages`, persisted `Locale`, interpolation and English fallback | Covered |
| Gaming, Pro, Blossom and Obsidian themes | Electric, Professional, Blossom and Obsidian token sets | Covered; Electric is the neutral name for the original gaming palette |
| Theme/language per-user behavior | Template preferences persist globally; adapter/user integration can supply scoped keys | Extensible; user-scoped keying is application policy |
| Button, badge, card, input, modal, progress and spinner | Generalized primitives in `template/ui.tsx` | Covered |
| Loading, empty, API error and forbidden states | `LoadingState`, `EmptyState`, `ErrorState`, `Alert`, `getErrorMessage`, 403 page | Covered |
| Home tiles and product entry cards | `Tile`, `Card`, responsive grids | Covered |
| Admin dashboards and responsive record lists | `PageHeader`, `StatCard`, `DataTable`, dashboard composition | Covered |
| Superadmin user search/role UI | Superadmin route and generalized user-management demo | Covered; API mutations remain consumer code |
| Support/contact form | Generalized responsive support form demo | Covered; submit endpoint remains consumer code |
| Announcement and subscription warning banners | `AppShell.announcements` slot plus `Alert` | Covered |
| Not-found and access-denied pages | Generic 404/403 status pages | Covered |
| Docker/Nginx SPA deployment | `Dockerfile`, Compose, Nginx fallback and health endpoint | Covered |
| Product-specific games, scoring, leaderboards and editors | Build from primitives; retain Diktat domain components and API modules | Intentionally application-specific |
| Stripe checkout and subscription API | Use `Modal`, `Alert`, guarded routes around Stripe's SDK | Intentionally integration-specific |
| Obsidian product-specific light-network animation | Keep as an optional Diktat visual module | Intentionally product-specific, not required by the general system |

## Reconstruction conclusion

The Diktat application can be rebuilt on this template without a missing structural primitive. Its existing pages would move under `AppShell`; routes map directly to `RouteGuard`; its API auth payload maps through `createHttpAuthAdapter`; the existing four visual palettes map to the four template themes; and its admin, superadmin, support and responsive data views can be composed from the exported components.

The work that would remain is normal product integration rather than framework invention: preserve Diktat's game engines, API/query modules, Stripe SDK integration, domain translations and specialized editors, then compose them inside the generalized shell and primitives. Those pieces should not be copied into a common UI template because doing so would reintroduce gaming and billing assumptions.

## Recommended migration order

1. Wrap Diktat routes in `TemplateProvider` using a response mapper for its existing auth API.
2. Replace `Layout`, `Header`, `MobileNav`, theme picker and language menu with `AppShell` configuration.
3. Alias Diktat's UI primitive imports to Iris exports and resolve intentional variant-name differences.
4. Move public/user/admin/superadmin route groups to `RouteGuard`.
5. Keep domain pages and TanStack Query hooks intact, replacing only their layout primitives.
6. Run visual regression checks for all four themes at desktop and mobile breakpoints.

## Deferred decisions

- Whether consumer applications want local-storage bearer tokens, session storage, or HTTP-only cookies.
- Whether language/theme preferences should be global, per-user in browser storage, or persisted by the backend.
- Whether the retained legacy network-graph components should move into a separate optional package in a future major release.
