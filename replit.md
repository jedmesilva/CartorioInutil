# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Image/PDF processing: Sharp, pdf-lib, and Poppler (`pdftoppm`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Stamps images and PDFs with the supplied transparent cartório seal.
- Automatically chooses the original green ink on light areas or off-white ink on dark areas; PDF pages are analyzed separately.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The API uses the `poppler` Nix package configured in `.replit` to render PDF page previews for contrast sampling. Pages are streamed through the renderer; files are not saved for this analysis.
- Transparent image regions have no known display background, so they default to the original green seal.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
