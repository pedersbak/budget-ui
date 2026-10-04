# Instructions for Codex agents

## Purpose

Iris UI is a product-neutral React application template and reusable component library. It was derived from successful interaction patterns in `diktat-ui`, but shared code must never assume a gaming, education, billing, or other product domain.

Future Codex sessions should leave the repository usable in both forms:

1. A runnable reference application demonstrating the template.
2. An importable library with declarations and a public API from `src/index.ts`.

Read `README.md` before making architectural changes. Read `docs/diktat-reconstruction-audit.md` when changing the shell, authentication, authorization, themes, responsive behavior, administration surfaces, or component coverage.

## Repository map

- `src/template/` — reusable product-neutral code. This is the template's core.
- `src/demo/` — example application and dummy data. Product examples belong here, not in the core.
- `src/styles.css` — global design tokens, themes, responsive layout and component styles.
- `src/index.ts` — supported library exports. Export a reusable addition here.
- `src/auth/`, `src/components/`, `src/hooks/`, `src/types/` — legacy-compatible Iris exports retained for existing consumers.
- `docs/diktat-reconstruction-audit.md` — coverage and migration audit against the reference application.
- `Dockerfile`, `docker-compose.yml`, `nginx.conf` — production demo deployment.
- `dist/` — generated output. Never edit or commit it.

## Core architectural rules

### Keep the core product-neutral

- Do not add product-specific nouns, routes, API payloads, rules, assets, or workflows to `src/template/`.
- Put illustrative behavior and dummy data in `src/demo/`.
- Put real domain behavior in the consuming application.
- Generalize a repeated product pattern only when its API is useful outside that product.
- Prefer configuration, composition and render callbacks over flags tied to one use case.

Good core concepts include `Tile`, `DataTable`, `RouteGuard`, `AuthAdapter`, announcements and role-aware navigation. A game engine, subscription provider, school-specific editor or product API module is not core template code.

### Preserve the two build targets

- `npm run build` builds the runnable demo.
- `npm run build:library` builds the package and TypeScript declarations.
- Avoid importing demo code from `src/template/` or `src/index.ts`.
- React, React DOM, React Router and Lucide are externalized in the library bundle. If dependencies change, reconsider library externalization and package metadata together.
- Keep the package stylesheet export aligned with the CSS filename emitted by `vite.lib.config.ts`.

### Public API discipline

- Consumers should import reusable features through `src/index.ts`, not internal paths.
- Export both runtime values and their relevant prop/config types.
- Prefer backwards-compatible additions. Do not remove the legacy network and auth exports without an explicit migration request.
- When changing a public type, search the demo and legacy components for consumers before editing it.

## Building a new application from the template

Use this sequence unless the task explicitly asks for a different architecture:

1. Update the package name, page title and `AppBrand` configuration.
2. Define navigation as `NavItem[]`; use `authenticated` and `minimumRole` instead of duplicating role checks in UI components.
3. Replace demo routes and pages with application pages while retaining `TemplateProvider`, `AppShell` and `RouteGuard`.
4. Provide complete message dictionaries to `TemplateProvider` and use `useTemplate().t` for application UI.
5. Replace `demoAuthAdapter` with `createHttpAuthAdapter` or a custom `AuthAdapter`.
6. Map backend authentication responses to `AuthSession` rather than changing the shared session type to match one API.
7. Compose screens from the exported primitives and extend the primitives only for genuinely reusable behavior.
8. Customize themes through CSS custom properties before adding theme-specific component overrides.
9. Remove or replace demo shortcuts and dummy data before treating an application as production-ready.

## Authentication and authorization

- The role hierarchy is `user < admin < superadmin`; use `hasRole` for comparisons.
- Protect routes with `RouteGuard`. Hiding a navigation item is not an authorization boundary.
- `AuthAdapter` is the backend seam. Keep token response mapping, refresh behavior and logout integration inside an adapter.
- `demoAuthAdapter` is development-only and accepts arbitrary credentials. Do not use it as production authentication.
- `createHttpAuthAdapter` currently persists sessions in local storage. For sensitive applications, prefer a custom adapter using secure HTTP-only cookies or another approved storage model.
- Never commit tokens, passwords, API keys, production endpoints or a populated `.env` file.
- Backend authorization remains mandatory even when the UI has route guards.

## Themes and styling

- Supported theme identifiers are `electric`, `professional`, `blossom` and `obsidian`.
- Shared components must use design tokens such as `--bg`, `--card`, `--text`, `--accent`, `--success` and `--danger` rather than fixed palette values.
- Keep theme differences primarily in the token declarations at the top of `src/styles.css`.
- Preserve visible focus treatment and `prefers-reduced-motion` behavior.
- Any new layout must be checked at desktop width and at approximately 390×844 mobile width.
- Mobile navigation holds at most five primary destinations. Less common and superadmin-only destinations should remain in the drawer or desktop navigation.

## Localization

- Supported demo locales are English and Danish.
- English is the fallback dictionary, so every reusable key needs an English value.
- Use interpolation through `t('key', { value })`; do not assemble translated sentences from fragments.
- Reusable components should accept labels as props or obtain them from the provider. Avoid introducing hard-coded user-facing strings in the core.
- When adding a demo message, update both dictionaries in `src/demo/messages.ts`.

## Components and application states

- Reuse existing primitives before introducing another visual convention.
- Every data-driven screen should account for loading, empty, error and success states where applicable.
- Use `getErrorMessage` at API boundaries instead of showing raw response objects.
- Use `DataTable` for tabular desktop data; retain its labeled-card mobile behavior.
- Forms need associated labels, useful validation messages, correct autocomplete attributes and disabled/loading submit behavior.
- Modals must retain Escape handling, backdrop close behavior, an accessible name and keyboard focus visibility.
- Icon-only buttons require an accessible label or title.

## Data and integrations

- Keep server-state libraries and API clients in the consuming application unless the abstraction is demonstrably cross-product.
- Do not put Stripe, game, analytics vendor, support vendor or other service SDKs in the core template.
- Expose integration points as adapters, callbacks, slots or ordinary children.
- Dummy demo mutations may use local component state, but label them clearly and do not imply persistence.

## Required workflow for changes

Before editing:

1. Inspect `git status` and preserve unrelated or user-owned changes.
2. Search with `rg` for the component/type being changed and its exports.
3. Determine whether the change belongs to the reusable core, demo, legacy compatibility layer or consumer application.

After editing, run the checks proportional to the change. For normal source changes, run all of:

```sh
npm test
npm run build
npm run build:library
git diff --check
```

For layout, navigation, theme or form work, also open the demo and verify the affected flow at desktop and mobile sizes. Check all materially affected themes; at minimum verify one dark and one light theme.

For deployment changes, also run:

```sh
docker compose config
docker build -t iris-ui-template:verification .
```

If Docker Hub or another external registry is unavailable, report that limitation separately from configuration validation.

## Tests

- Add focused tests for reusable logic, role behavior, adapters and error normalization.
- Prefer testing observable behavior over internal implementation details.
- Keep test files out of emitted declaration output; `tsconfig.lib.json` excludes `*.test.ts` and `*.test.tsx`.
- A passing demo build does not replace the library build because their entry points and output constraints differ.

## Documentation expectations

- Update `README.md` for user-facing setup or public API changes.
- Update the reconstruction audit if a change affects whether `diktat-ui` can be rebuilt from the template.
- Record important integration assumptions and intentionally deferred decisions.
- In final handoff notes, state which build, test, visual and Docker checks actually ran; do not imply a check passed if it was skipped or blocked.

## Definition of done

A template change is complete when:

- the core remains product-neutral;
- the demo demonstrates the behavior without becoming a dependency of the core;
- desktop and mobile behavior remain usable;
- authorization and error states are handled;
- the public export surface and documentation are current;
- tests, application build and library build pass;
- generated artifacts and secrets are not committed.
