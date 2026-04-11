# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HELA RES** is an Electron-based POS for restaurants. UI and all user-facing text is in Spanish. Built with React 19 + TypeScript + Vite + better-sqlite3. Forked from `hela-pos-electron` (a grocery store POS) and refactored for restaurant operations.

## Commands

```bash
npm run dev              # Vite + Electron in dev mode
npm run build            # Build vite + electron-builder (NSIS installer for Windows)
npm run lint             # ESLint
npx tsc -p tsconfig.app.json --noEmit      # Type-check React app (renderer)
npx tsc -p tsconfig.electron.json --noEmit # Type-check Electron main/preload
npx electron-rebuild -f -w better-sqlite3  # Rebuild native module after npm install
```

> **Type-checking:** Always use the project-specific tsconfig commands above. `npx tsc --noEmit` (root tsconfig) fails due to a pre-existing `ignoreDeprecations: "6.0"` issue in `tsconfig.json` — it is not usable for validation.

> **Electron launch:** if `app.isPackaged` throws "Cannot read properties of undefined", the env var `ELECTRON_RUN_AS_NODE` is set in your shell. The dev script uses `scripts/run-electron.cjs` which strips it before launching.

## Architecture

### High-level

- **React app** (`src/`) — UI, runs in the renderer process.
- **Electron main** (`electron/`) — owns the SQLite database, IPC handlers, and printing.
- **Preload** (`electron/preload.ts`) — exposes `window.electronAPI` to the renderer with:
  - `query(channel, data)` — generic IPC invoke for all DB operations
  - `printKitchenTicket(data)` — thermal printer via `electron-pos-printer`
  - `openCashDrawer()` — ESC/POS cash drawer kick

### Database

- SQLite via `better-sqlite3`. Schema in `electron/database/migrations.ts`, runs on app start via `electron/database/connection.ts`.
- Tables: `users`, `restaurant_tables`, `menu_categories`, `menu_items`, `orders`, `order_items`, `inventory_items`, `waste_records`, `shifts`.
- IDs are UUIDs generated server-side (`crypto.randomUUID()`). Timestamps default to `datetime('now')` (UTC).
- User roles: `'Dueño' | 'Administrador' | 'Mesero'`. Mesero can only see Dashboard + Mesas/Comandas; admin actions require PIN auth.

### IPC pattern

Each domain follows a triple:
1. **Handler** in `electron/ipc/<domain>Handlers.ts` — registers `ipcMain.handle('<domain>:<action>', ...)`. Multi-table writes use `db.transaction(...)`.
2. **Service** in `src/services/` — calls `window.electronAPI.query('<domain>:<action>', data)` and types the response.
3. **Hook** in `src/hooks/` — exposes state + functions to React components, with optimistic updates for simple operations and full reloads for cross-entity ones.

Current handler files: `userHandlers`, `restaurantTableHandlers`, `menuHandlers`, `orderHandlers`, `wasteHandlers`, `shiftHandlers`.

Services are split across files:
- `restaurantService.ts` — tables, menu, orders, shifts, printing, cash drawer
- `userService.electron.ts` — user CRUD
- `wasteService.electron.ts` — inventory items + waste records (exports `InventoryItem` and `WasteRecord` types)

Hooks: `useRestaurant` (tables/orders/menu/shifts), `useUsers`, `useWaste`.

### App structure and routing

- `App.tsx` is the **single source of routing and state composition** — there is no router.
- `renderView()` switch handles: `dashboard`, `floorPlan`, `menuAdmin`, `inventory`, `users`, `reports`.
- `currentUser` is persisted in `localStorage` for session restore.
- All hooks (`useRestaurant`, `useUsers`, `useWaste`) are called at the App level and props are drilled down.

### Shift-gated operations

Operations require an active shift (production mode):
- `FloorPlan` view is blocked with a banner when `activeShift === null`. Admins can open a shift inline.
- `OrderPanel` blocks "Abrir Mesa" and "Cobrar" with a toast error if no shift is active.
- `OrderPanel` receives `activeShift` as a prop from `App.tsx`.

### Payment flow (OrderPanel)

The pay dialog uses a `payStep` state machine: `'method' → 'cash' | 'card' | 'split'`.
- **Cash**: input for received amount, quick-add buttons (+$50/100/200/500), real-time change calculation, fires `openCashDrawer()` on confirm.
- **Card**: confirmation screen before closing the order.
- **Split**: parts (2-20) + method selector; Tarjeta shows card confirmation before closing. Payment method is stored as `dividido-{parts}-{method}`.

### Order flow

1. Click free table → `createOrder` → table becomes `ocupada`.
2. Add items → `addOrderItem` (recalculates `orders.total`).
3. Send to Kitchen → `sendToKitchen` flips `sent_to_kitchen=1` and triggers `printKitchenTicket`.
4. Request Bill → table becomes `cuenta_pedida`.
5. Pay → `closeOrder(payment_method)` → order `cobrada`, table back to `libre`.

### Dashboard

`Dashboard` receives props (`tables`, `activeOrders`, `activeShift`, `inventoryItems`) and shows:
- Live metric cards (occupied tables, open orders, shift sales, low-stock alerts)
- Table status grid (badges by status color)
- Active orders list with elapsed time color coding

### Reports

`Reports.tsx` has two tabs: "Turno Actual" (current shift orders + sales-by-waiter table) and "Historial" (shift history). Sales by waiter uses the `shifts:getSalesByWaiter` IPC channel.

### Adding a new module

1. Add tables to `electron/database/migrations.ts`.
2. Create handler file in `electron/ipc/<name>Handlers.ts` exporting `register<Name>Handlers()`. Register it in `electron/main.ts` inside `app.whenReady()`.
3. Add types to `src/types/restaurant.ts` (or new file).
4. Add service methods to `src/services/restaurantService.ts` (or a new service file).
5. Add state and operations to `src/hooks/useRestaurant.ts` (or a new hook).
6. Build the React component under `src/components/restaurant/`.
7. Wire it into `src/App.tsx` `renderView()` and the sidebar `navItems`.
8. Run both type-checks before committing.

### Things to know

- All user-facing text is Spanish.
- Toast notifications use `sonner` (already mounted in App.tsx).
- shadcn/ui components live in `src/components/ui/` — reuse them; do not introduce another component library.
- `tsconfig.app.json` has `noUnusedLocals` and `noUnusedParameters` enabled — clean up unused imports/vars or the type-check will fail.
- Types are in `src/types/restaurant.ts` (core domain) and `src/services/wasteService.electron.ts` (inventory/waste types are co-located with the service).