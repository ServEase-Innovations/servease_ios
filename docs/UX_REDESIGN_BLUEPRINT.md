# Serveaso Mobile UX Redesign Blueprint (Phase 1)

This document defines the target UX architecture for a full redesign focused on:

- easier navigation
- faster booking completion
- better repeat usage / retention
- visual consistency with the current Glass + Slate brand direction

It is intentionally implementation-oriented so we can build this in phases without breaking current production behavior.

---

## 1) Product Goals

### Primary goals

1. Reduce time to first successful booking.
2. Reduce drop-off in provider selection and booking confirmation.
3. Increase repeat booking frequency.
4. Improve daily/weekly active usage via useful reminders and quick actions.

### UX quality goals

1. Every key task completes in <= 3 taps from a primary tab.
2. No dead-end screens; every screen has clear next action.
3. Consistent components, spacing, and interaction patterns.

---

## 2) New App Information Architecture

### Bottom navigation (customer mode)

1. `Home`
2. `Bookings`
3. `Messages`
4. `Account`

### Cross-cutting surfaces

- Global search (provider/services)
- Notifications sheet
- Contextual bottom sheets (provider details, booking details, filters)

### Proposed route map

- `Home`
  - Service categories
  - Active booking summary card
  - Recommended providers
- `ProviderDiscovery`
  - Filter/sort chips
  - Compact provider feed
- `ProviderDetailsSheet`
  - Overview / Availability / Reviews tabs
  - Sticky primary CTA
- `BookingFlow`
  - Step 1: Type
  - Step 2: Date/Time
  - Step 3: Review/Confirm
- `Bookings`
  - Upcoming / Past / Cancelled segmented rail
  - Booking cards + quick actions
- `BookingDetailsSheet`
  - Timeline / Payment / Vacation / Support tabs
- `Messages`
  - Active conversations and support
- `Account`
  - Profile, addresses, payment methods, settings

---

## 3) Key UX Patterns (to standardize)

1. **Segmented sticky rails** for section switching.
2. **Bottom-sheet details** instead of full-page context switches.
3. **Primary + secondary action model** on cards.
4. **Progressive disclosure** (compact default, details on demand).
5. **Status-first communication** (chips and timeline states).

---

## 4) Visual System: Glass + Slate

### Color usage model

- `Brand gradient` for top chrome and primary CTAs only.
- `Slate surfaces` for cards and sections.
- `Semantic accents` for status only:
  - success, warning, error, info

### Component rules

- Card radius: 14-20
- Button min height: 44
- Chip radius: pill / 999
- Shadow: soft, low elevation

### Typography hierarchy

- H1: screen title
- H2: section title
- Body: detail values
- Caption: hints and metadata

---

## 5) Functional Parity Requirements

These web behaviors must exist in mobile bookings:

1. `View Details`
2. `Modify Booking` (with eligibility rules)
3. `Add/Manage Vacation`
4. `Payment pending` recovery flow
5. `Review` on completed bookings
6. `Book Again`

---

## 6) Analytics + Retention Event Model

Track these events before/after redesign:

1. `home_opened`
2. `provider_card_opened`
3. `provider_details_opened`
4. `booking_flow_started`
5. `booking_flow_step_completed`
6. `booking_confirmed`
7. `booking_modified`
8. `vacation_added`
9. `payment_completed`
10. `rebook_clicked`

Core KPIs:

- time-to-book
- provider selection conversion
- booking completion rate
- repeat booking rate (7/30 day)
- DAU/WAU

---

## 7) Engineering Rollout Plan

### Phase 1 (current)

- Define IA, UX rules, component standards, and rollout plan.

### Phase 2

- Build shared UI primitives:
  - `AppShell`
  - `SegmentedRail`
  - `ActionRow`
  - `StatusChip`
  - `GlassCard`
  - `BottomSheetScaffold`

### Phase 3

- Rebuild `Bookings` fully on new primitives.

### Phase 4

- Rebuild `Provider Discovery` and provider details sheet.

### Phase 5

- Rebuild `BookingFlow` and confirm step.

### Phase 6

- Final polish, analytics audit, accessibility pass, perf tuning.

---

## 8) Immediate Next Implementation Tasks

1. Add shared primitives folder: `src/design-system/`.
2. Introduce route constants + navigation map for target IA.
3. Refactor `Bookings.tsx` to use `SegmentedRail` + `GlassCard` + `ActionRow`.
4. Extract booking status logic into `src/UserProfile/bookingUxRules.ts`.
5. Add lightweight analytics wrapper and emit events on key actions.

---

## 9) Guardrails

1. No breaking API contract changes.
2. Keep current booking/payment/vacation logic intact while refactoring UI.
3. Ship in small reversible PR-sized steps.
4. Validate each phase on both iOS and Android.

