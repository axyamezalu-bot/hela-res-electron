# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HELA POS Pro is a Point-of-Sale system for a Mexican fruit and grocery store called Frutería Bugarín, located in Nayarit, México. The UI and all user-facing text is in Spanish. Built with React 19 + TypeScript + Vite.

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint across all TS/TSX files
- `npm run preview` — Preview production build

## Architecture

**Single-page app with no router.** Navigation is managed via a `ViewType` state in `App.tsx` that switches between views (dashboard, sales, inventory, users, etc.). A `ViewProvider` context in `src/context/ViewProvider.tsx` handles PIN-based authorization for protected views (cash register, sales reports) when the current user is a Cajero.

**All core state lives in `App.tsx`** as `useState` hooks (products, users, clients, sales, credits, cash register state). Data types (`Product`, `User`, `Client`, `Sale`, `CreditAccount`, `CashStart`) are defined and exported from `App.tsx`. Event handlers for CRUD operations are defined in App and passed down as props.

**Supabase integration is partially wired.** `src/lib/supabase.ts` initializes the client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars. `src/services/productService.ts` and `src/hooks/useInventory.ts` exist but the app currently uses hardcoded seed data in `App.tsx` state rather than fetching from Supabase.

**User roles:** Dueño (owner), Administrador, Cajero. The business is Frutería Bugarín — a fruit and grocery retail store. Product categories include fruits, vegetables, dairy, and general groceries.

**Barcode scanner support:** `src/hooks/useBarcodeScanner.ts` listens for rapid keyboard input ending with Enter, treating it as a barcode scan.

## UI Stack

- **shadcn/ui** components in `src/components/ui/` (Radix primitives + Tailwind + `class-variance-authority`)
- **Tailwind CSS 3** for styling
- **lucide-react** for icons
- **sonner** for toast notifications
- **recharts** for dashboard charts
- **react-hook-form** + **zod** for form validation
- Path alias: `@/*` maps to `./src/*`
