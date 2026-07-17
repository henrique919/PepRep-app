# PepRep

A premium, local-first peptide reconstitution calculator and dose tracker.

PepRep is a precision **measurement** and **record-keeping** instrument for people who have
already decided what they are doing. It computes injection draws exactly, shows its working,
and keeps an auditable record of what the user actually did. It is an instrument, not an
advisor: it never recommends a peptide, dose, stack, cycle, frequency or protocol.

> PepRep is a measurement tool. It is not medical advice and does not recommend doses.

## Product boundaries

- The user enters 100% of their own plan; the app only does arithmetic and record-keeping.
- No dosing suggestions, "typical" ranges, stacks or cycle guidance — anywhere.
- No account, no sign-in, no paywall. The calculator is never gated.
- Fully offline: no network calls, no analytics, no telemetry. All data lives on-device.

## The one rule that matters

A **U-100 insulin syringe is always 100 units per mL**. Syringe capacity
(30 / 50 / 100 units = 0.3 / 0.5 / 1.0 mL) describes barrel volume only and is used solely
for overflow warnings and the gauge drawing's extent. It is **never** a units-per-mL
multiplier. This invariant is test-locked in `src/engine/__tests__/index.test.ts`.

## Stack

- React Native + Expo SDK 54, TypeScript (strict)
- expo-router (typed routes), Zustand, AsyncStorage behind a `StorageAdapter`
- date-fns for all date logic, react-native-svg for the syringe gauge and body map
- expo-notifications (local only), expo-file-system + expo-sharing (export)
- Inter (UI) + IBM Plex Mono (all numerics) via expo-font
- Jest + ts-jest for the engine test suite

## Architecture

```
src/
  engine/           Pure TypeScript arithmetic. No React, no RN, no I/O, no Date.now().
                    The ONLY place arithmetic may exist. UI never computes numbers.
    index.ts        Draw + diluent calculations (verbatim, test-locked)
    syringe.ts      Barrel gauge geometry
    schedule.ts     Date logic (grouping, reminders) — "now" is always a parameter
    inventory.ts    Vial remaining-material bookkeeping
    __tests__/      48 unit tests
  db/
    adapter.ts      StorageAdapter interface (AsyncStorage + in-memory impls)
    migrations.ts   Versioned local schema
    repositories/   The only code that touches storage keys
  store/            Zustand slices — call repositories, never persist directly
  components/ui/    Primitives with zero domain knowledge
  components/domain/ Render engine output, never compute it
  theme/tokens.ts   All colours, spacing, radii, type — no hardcoded values in components
app/                expo-router routes (tabs: Calculate, Log, Vials, Settings)
```

## Running

```sh
bun install
bun run start     # Expo dev server
bunx jest         # engine test suite
```
