# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HELA RES** is an Electron-based POS for restaurants. UI and all user-facing text is in Spanish. Built with React 19 + TypeScript + Vite + better-sqlite3. Forked from `hela-pos-electron` (a grocery store POS) and refactored for restaurant operations.

## Commands

```bash
npm run dev              # Vite + Electron in dev mode
npm run build            # Build vite + electron-builder (NSIS installer for Windows)
npm run lint             # ESLint
npx tsc --noEmit                          # Type-check React app
npx tsc -p tsconfig.electron.json --noEmit # Type-check Electron main/preload
npx electron-rebuild -f -w better-sqlite3  # Rebuild native module after npm install
```

> **Important:** if `app.isPackaged` throws "Cannot read properties of undefined", the env var `ELECTRON_RUN_AS_NODE` is set in your shell. The dev script uses `scripts/run-electron.cjs` which strips it before launching.

## Architecture

### High-level

- **React app** (`src/`) — UI, runs in the renderer.
- **Electron main** (`electron/`) — owns the SQLite database and exposes IPC handlers.
- **Preload** (`electron/preload.ts`) — exposes a typed `window.electronAPI` to the renderer with two methods:
  - `query(channel, data)` — thin wrapper around `ipcRenderer.invoke` for DB operations
  - `printKitchenTicket(data)` — print to thermal printer via `electron-pos-printer`

### Database

- SQLite via `better-sqlite3`. Schema lives in `electron/database/migrations.ts` and runs on app start via `electron/database/connection.ts`.
- Tables: `users`, `restaurant_tables`, `menu_categories`, `menu_items`, `orders`, `order_items`, `inventory_items`, `waste_records`, `shifts`.
- IDs are UUIDs generated server-side. Timestamps default to `datetime('now')` (UTC).
- User roles: `'Dueño' | 'Administrador' | 'Mesero'`. Mesero can only see Dashboard + Mesas/Comandas; admin actions require PIN auth.

### IPC pattern

For each domain, there is a triple:
1. **Handler** in `electron/ipc/<domain>Handlers.ts` registers `ipcMain.handle('<domain>:<action>', ...)`. Multi-table writes use `db.transaction(...)`.
2. **Service** in `src/services/restaurantService.ts` (one per file or grouped) calls `window.electronAPI.query('<domain>:<action>', data)` and types the response.
3. **Hook** in `src/hooks/useRestaurant.ts` exposes state + functions to React components, with optimistic updates for simple operations and full reloads for cross-entity ones (e.g. closing an order updates both `orders` and `restaurant_tables`).

The main hook (`useRestaurant`) loads everything on mount via `Promise.all(...)` and exposes a single API surface used by `App.tsx`.

### Restaurant module

Components live under `src/components/restaurant/`:

| Component | Purpose |
|---|---|
| `FloorPlan.tsx` | Visual table map with `@dnd-kit` drag-and-drop in edit mode. Each table is colored by status (libre/ocupada/cuenta_pedida). Click → opens `OrderPanel`. |
| `OrderPanel.tsx` | Right-side `Sheet` with two tabs: **Menú** (categorized item grid) and **Comanda** (line items split into "por enviar" and "en cocina"). Footer has Send-to-Kitchen, Request Bill, Pay, Cancel actions. |
| `MenuAdmin.tsx` | Admin-only screen with Categories tab (color-coded) and Items tab (filter + search + RHF/zod form for create/edit). |

Order flow:
1. Click free table → `createOrder` → table becomes `ocupada`.
2. Add items → `addOrderItem` (recalculates `orders.total`).
3. Send to Kitchen → `sendToKitchen` flips `sent_to_kitchen=1` and triggers `printKitchenTicket`.
4. Request Bill → table becomes `cuenta_pedida`.
5. Pay → `closeOrder(payment_method)` → order `cobrada`, table back to `libre`.

### Adding a new module

1. Add tables to `electron/database/migrations.ts`.
2. Create handler file in `electron/ipc/<name>Handlers.ts` exporting `register<Name>Handlers()`. Register it in `electron/main.ts` inside `app.whenReady()`.
3. Add types to `src/types/restaurant.ts` (or new file).
4. Add service methods to `src/services/restaurantService.ts`.
5. Add state and operations to `src/hooks/useRestaurant.ts` (or a new hook).
6. Build the React component under `src/components/restaurant/`.
7. Wire it into `src/App.tsx` `renderView()` and the sidebar `navItems`.
8. Run both type-checks before committing.

### Things to know

- `App.tsx` is the single source of routing/state composition — there is no router.
- `currentUser` is persisted in `localStorage` for session restore.
- All user-facing text is Spanish.
- Toast notifications use `sonner` (already mounted).
- shadcn/ui components live in `src/components/ui/` — reuse them; do not introduce another component library.
