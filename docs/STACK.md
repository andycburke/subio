# Technology Stack & Services

## Core stack
- Frontend: Next.js (App Router), React, TypeScript
- Styling & UI: Tailwind CSS, shadcn/ui, Radix icons
- Component dev: Storybook
- Build / Tooling: Node.js, npm, ESLint, Prettier, Husky, lint-staged

## Backend & persistence
- Runtime: Next.js server (Node)
- ORM: Drizzle ORM
- Local dev DB: PGlite (embedded)
- Production DB: PostgreSQL (compatible providers: Neon, others)
- Migrations & studio: Drizzle Kit / Drizzle Studio

## Authentication & Billing
- Authentication: Clerk
- Payments / subscriptions: Stripe (webhooks + prices)

## Observability & logging
- Error monitoring & session replay: Sentry + Spotlight
- Logging: Pino with Logtail / Better Stack integration

## Testing & monitoring as code
- Unit / integration: Vitest + React Testing Library
- E2E: Playwright
- Synthetic monitoring: Checkly
- Visual testing (optional): Percy
- Coverage: Codecov

## Developer helpers / CI
- i18n: next-intl + Crowdin
- Static analysis & formatting: ESLint, Prettier
- CI: GitHub Actions

## Where to look in this repo
- Environment schema and keys: [`Env`](src/libs/Env.ts)
- DB initialization & runtime choice (PGlite vs Postgres): [src/libs/DB.ts](src/libs/DB.ts)
- Database schema (Drizzle): [`organizationSchema`, `todoSchema`](src/models/Schema.ts)
- Drizzle config & migrations: [drizzle.config.ts](drizzle.config.ts) and [migrations/](migrations/)
- Sentry client config: [sentry.client.config.ts](sentry.client.config.ts)
- Logging setup: [src/libs/Logger.ts](src/libs/Logger.ts)
- Project docs and setup instructions: [README.md](README.md)
