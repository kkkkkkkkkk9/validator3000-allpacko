# Validator 3000

## Project Overview

Multi-product wireframing and prototype review platform. An AI agent authors screen HTML via MCP tools; a Next.js viewer renders those screens in a phone-frame preview with live comments, flow navigation, and theme switching. Three components:

1. **Next.js app** (`src/`) — read-only viewer for browsing products, flows, and screens
2. **MCP server** (`mcp-server/`) — CRUD tools for products, flows, screens, and comments
3. **Supabase** — Postgres data store with RLS, Realtime subscriptions, and Auth

The MCP server is the primary authoring interface. The AI agent creates and edits wireframe HTML through MCP tools; the viewer reflects changes in real time.

## Tech Stack

* **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
* **Styling:** Tailwind v4 with CSS custom properties via `theme.css` + wireframe stylesheet
* **Database:** Supabase (Postgres + RLS + Realtime)
* **Auth:** Supabase Auth (`@supabase/ssr`), PKCE flow, Google OAuth
* **MCP Server:** `@modelcontextprotocol/sdk` with stdio transport
* **Package Manager:** npm (no workspaces — MCP server has its own `package.json`)

## Architecture

```
                  ┌─────────────┐
                  │  AI Agent   │
                  │ (Claude etc) │
                  └──────┬──────┘
                         │ stdio
                  ┌──────▼──────┐
                  │  MCP Server │  service-role key
                  │  (Node.js)  │──────────────────┐
                  └─────────────┘                  │
                                                   ▼
┌─────────────┐       ┌─────────────┐       ┌───────────┐
│   Browser   │──────>│  Next.js    │──────>│ Supabase  │
│   Viewer    │       │  App        │       │ (Postgres │
└─────────────┘       └─────────────┘       │  + RLS)   │
                                            └───────────┘
                            ▲ Realtime
                            │ (screens table)
                      ┌─────┴──────┐
                      │  Browser   │
                      │  (live)    │
                      └────────────┘
```

* **Viewer** uses publishable key + user JWT; data access governed by RLS
* **MCP Server** uses service-role key with defense-in-depth `organization_id` filtering
* **Realtime** pushes screen content updates to the viewer for live preview

## Directory Structure

```
src/
  app/                  — Next.js App Router pages
    app/                — Authenticated app shell (/app/...)
      products/         — Product listing and detail pages
        [productSlug]/  — Product detail with flows
          flows/[flowSlug]/ — Flow viewer (prototype viewer)
    auth/callback/      — OAuth callback route
    login/              — Login page
    signup/             — Signup page
    onboarding/         — Workspace creation
  components/
    layout/             — App shell, product switcher
    prototype/          — Viewer components (phone frame, screen renderer,
                          flow panel, TOC panel, comments panel, theme toggle)
  hooks/
    use-comments.ts     — Comment CRUD hook
    use-prototype-nav.ts — Flow/screen navigation state
    use-realtime-screens.ts — Supabase Realtime subscription for live screen updates
    use-theme.ts        — Theme state (dark, light, sky, sage, lavender, sand, rose)
  lib/
    comments/           — Server-side comment queries
    flows/              — Server-side flow queries
    products/           — Server-side product queries
    screens/            — Server-side screen queries
    supabase/           — Supabase client setup
      admin.ts          — Service-role client (server-only)
      auth.ts           — getClaims()-based auth helpers (server-only)
      client.ts         — Browser client
      env.ts            — Env var validation
      middleware.ts     — Session refresh for proxy
      server.ts         — Server component client
    workspace.ts        — Multi-org workspace resolution + cookie
  providers/
    theme-provider.tsx  — Theme context provider
  styles/
    globals.css         — Imports Tailwind + theme + wireframe
    theme.css           — Tailwind v4 @theme tokens
    wireframe.css       — Wireframe aesthetic classes (phone frame, panels, etc.)
  utils/
    cx.ts               — tailwind-merge class helper
    slugify.ts          — URL slug generation
  proxy.ts              — Request interceptor (auth gate + session refresh)

mcp-server/
  src/
    index.ts            — Server entrypoint (stdio transport)
    lib/
      helpers.ts        — textResult/errorResult/slugify utilities
      supabase.ts       — Service-role Supabase client + getOrgId()
    tools/
      products.ts       — list/create/update/delete products
      flows.ts          — list/create/update/delete/reorder flows
      screens.ts        — list/get/create/update/delete/reorder screens
      comments.ts       — list/add/delete comments
      utility.ts        — get_wireframe_styles, get_screen_template

scripts/
  seed-allpacko.ts      — Seed script for demo data
```

## Commands

* `npm run dev` — Start Next.js dev server (Turbopack)
* `npm run build` — Production build
* `npm run lint` — ESLint
* `npm run seed` — Seed demo data (`npx tsx scripts/seed-allpacko.ts`)

### MCP Server

```bash
cd mcp-server
npm run build          # tsc compile
npm run start          # node dist/index.js (stdio)
npm run dev            # tsc --watch
```

## Auth Rules (CRITICAL)

* **Server-side:** Always use `getClaims()` via `getClaimsUser()` from `@/lib/supabase/auth` — never `getSession()` (does not verify JWT signature)

* **Auth key:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`)

* **Request interceptor:** Uses `proxy.ts` not `middleware.ts` (Next.js 16 convention). The `proxy()` function calls `updateSession()` then checks for auth cookies

* **Redirect URLs:** Always use `getBaseUrl()` which reads `x-forwarded-host` / `x-forwarded-proto` headers — never `request.url` or `request.nextUrl.origin` (resolves to `0.0.0.0` on Render):

  ```typescript
  function getBaseUrl(request: NextRequest): string {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
    return `${proto}://${host}`;
  }
  ```

* **Cookie detection:** Use `.includes("-auth-token")` not `.endsWith()` (Supabase chunks large sessions into multiple cookies):

  ```typescript
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  ```

* **Auth callbacks:** Build the redirect `Response` first, wire Supabase cookie `setAll` to that response, then exchange the code. This order is required so the session cookies land on the redirect response.

* **Validate `next` param:** Must start with `/` and must NOT start with `//` (open redirect prevention):

  ```typescript
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";
  ```

* **Never expose raw Supabase `error.message` in redirects.** Map to generic messages and `console.error` the original server-side.

* **Google OAuth:** Pass `queryParams: { prompt: "select_account" }` to `signInWithOAuth`

## Database Rules

* All tables scoped by `organization_id` with RLS via `is_org_member()` helper

* **Defense-in-depth:** Every `.update()`, `.delete()`, and sensitive `.select()` must include `.eq("organization_id", orgId)` — do not rely solely on RLS:

  ```typescript
  // CORRECT
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("organization_id", orgId)  // Always include
    .select("*")
    .single();
  ```

* **Soft deletes:** Filter with `.is("deleted_at", null)` on every query that should exclude deleted records. Soft-delete by setting `deleted_at` to current timestamp:

  ```typescript
  .update({ deleted_at: new Date().toISOString() })
  ```

* Every `.limit(1)` query must have an explicit `.order()` — audit that the direction matches semantic intent

* **Migrations MUST be idempotent** — use `IF NOT EXISTS` / `IF EXISTS` / `DROP ... IF EXISTS` for all DDL. Patterns:
  - `ADD COLUMN IF NOT EXISTS` (not bare `ADD COLUMN`)
  - `CREATE INDEX IF NOT EXISTS`
  - `CREATE TABLE IF NOT EXISTS`
  - `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` before `ADD CONSTRAINT`

* **SECURITY DEFINER functions** must include `SET search_path = public` to prevent search-path injection

* **Data model:** Products contain Flows; Flows contain Screens; Screens have Comments. All four tables have `organization_id` for RLS scoping and `deleted_at` for soft deletes.

## Styling Rules

* **Wireframe aesthetic:** Monospace fonts (`SF Mono`, `Menlo`, `Monaco`, `Courier New`), ASCII art UI elements, dark background by default. This is a deliberate design choice — screens look like wireframe mockups.

* **No external UI component libraries.** All UI is custom-built with the wireframe style. Use the classes defined in `src/styles/wireframe.css` (`.box`, `.primary-btn`, `.ascii-input`, `.tab-bar`, `.member-row`, etc.)

* **Theme system:** Classes applied to `document.body`:
  - Dark: no class (default)
  - Light: `light`
  - Color variants: `light theme-sky`, `light theme-sage`, `light theme-lavender`, `light theme-sand`, `light theme-rose`

* **Screen HTML rendered in sandboxed iframe** with CSP (`default-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'`). The `ScreenRenderer` component injects wireframe CSS into the iframe's `<style>` tag. See `src/components/prototype/screen-renderer.tsx`.

* **Tailwind tokens** defined in `src/styles/theme.css` via `@theme` directive. Use semantic token names (`--color-primary`, `--color-border`, etc.)

* Use `cx()` from `@/utils/cx` for class merging (wraps `tailwind-merge`)

## MCP Server

* Runs locally via **stdio transport** — launched by an AI agent (Claude Code, Cursor, etc.)

* Uses **service-role key** (`SUPABASE_SERVICE_ROLE_KEY`) for full database access. This key must never be distributed to clients.

* **All queries must scope by `organization_id`** via `getOrgId()` which reads `V3K_ORG_ID` from env. Every tool calls `getOrgId()` and includes `.eq("organization_id", orgId)`.

* Never `console.log` to stdout in stdio transport — it corrupts the JSON-RPC stream. Use `console.error` (stderr) for debug logging.

* **Tool groups:**
  - `products` — list, create, update, soft-delete
  - `flows` — list, create, update, soft-delete, reorder
  - `screens` — list, get (with HTML), create, update (HTML content), soft-delete, reorder
  - `comments` — list (with author resolution), add, delete
  - `utility` — `get_wireframe_styles` (CSS reference), `get_screen_template` (starter HTML)

* **Screen HTML authoring:** The `update_screen` tool is the primary way to edit wireframe content. HTML should use the wireframe CSS classes from `get_wireframe_styles`. The viewer renders this HTML in a sandboxed iframe with the wireframe stylesheet injected.

## Component Patterns

* **Server Components** for data-fetching pages. Product/flow/screen data is fetched server-side in page components.

* **`"use client"` only for interactive components** — prototype viewer, comments panel, theme toggle, navigation hooks.

* **Shared utilities must NOT be in `"use client"` files.** Server-only modules (`lib/products/`, `lib/flows/`, etc.) import `"server-only"` to enforce RSC boundary.

* **`useSearchParams()` needs Suspense wrapper** — wrap any component using it in `<Suspense>`.

* **Workspace resolution** via `requireWorkspaceContext()` (memoized with `React.cache()`). Multiple layouts/pages in the same RSC render share one database call.

* **Workspace cookie:** `v3k_workspace` stores the active organization UUID. Set with `setWorkspaceCookie()`, read with `getWorkspaceCookie()`.

## Deployment

* **Render.com** with `runtime: node`

* **Config file:** `render.yaml` at repo root (not `render.blueprint.yaml`)

* **Build:** `npm ci && npm run build`

* **Start:** `node .next/standalone/server.js`

* **`HOSTNAME=0.0.0.0`** required (Next.js defaults to `127.0.0.1`)

* **`getBaseUrl()` required for all redirects** — Render sits behind a reverse proxy, so `request.url` resolves to internal addresses

* **`NEXT_PUBLIC_*` vars must be set at build time** (baked into client bundle)

## Environment Variables

### Next.js App (required)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) |
| `NODE_ENV` | `production` for deploys |
| `PORT` | Server port (default `3000`) |
| `HOSTNAME` | Bind address (`0.0.0.0` for Render) |

### Next.js App (optional)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### MCP Server (required)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL (not `NEXT_PUBLIC_` prefixed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key |
| `V3K_ORG_ID` | Organization UUID to scope all operations |
