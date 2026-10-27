# Delete Order Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to delete an entire order session (บิลทั้งห้อง) from both the order session page and the order history page, permitting the Host to delete directly while requiring an Admin PIN from environment variables for non-hosts, packaged as reusable client components.

**Architecture:** 
1. Server domain logic enforces authorization: Host can delete unconditionally; non-Host must supply a valid PIN matching `ORDER_DELETE_PIN` (or fallback admin passcodes) from environment variables.
2. A REST API route `DELETE /api/v1/sessions/[sessionId]` delegates to `OrderSessionService.deleteSession`.
3. Client architecture encapsulates the delete flow into a modular reusable component (`DeleteSessionButton` / dialog), handling host confirmation, PIN modal input, error states, and responsive styling.
4. Integrated into both `/order/[sessionId]` and `/history`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Zod, React Query, Tailwind CSS, Lucide React, Vitest.

**Spec:** User requirements discussion (Tan-Sang food ordering).

## Global Constraints
- Must answer user in Thai.
- Keep comments and docstrings preserved.
- Code should be clean, modular, and use reusable components.
- Admin PIN env variables supported: `ORDER_DELETE_PIN` > `ADMIN_PIN` > `ADMIN_PASSCODE` > `NEXT_PUBLIC_ADMIN_PASSCODE` > fallback `'1234'`.
- All tests must pass via `npx vitest run`.

## Review Focus
- Attempting to delete non-existent session returns 404 DomainError.
- Host deleting session does not require PIN.
- Non-host deleting session with missing or wrong PIN returns 403 DomainError.
- Non-host deleting session with correct PIN succeeds.
- Deletion cleans up in-memory cache and triggers query invalidation and navigation.

---

### Task 1: Domain Schemas and Repository Layer

**Files:**
- Modify: `src/features/order-session/order-session.schema.ts`
- Modify: `src/server/repositories/order-session.repository.ts`
- Modify: `src/test/order-session-core.test.ts`

- [ ] Add `DeleteOrderSessionInputSchema` to `src/features/order-session/order-session.schema.ts`.
- [ ] Add `deleteSession(sessionId: string): Promise<void>` method signature to `IOrderSessionRepository`.
- [ ] Implement `deleteSession` in `SupabaseOrderSessionRepository` in `src/server/repositories/order-session.repository.ts`.
- [ ] Update `InMemoryOrderSessionRepository` in `src/test/order-session-core.test.ts` to implement `deleteSession`.

### Task 2: Service Layer Logic & Unit Tests

**Files:**
- Modify: `src/server/services/order-session.service.ts`
- Test: `src/test/order-session-core.test.ts`

- [ ] Write unit tests for `deleteSession` in `src/test/order-session-core.test.ts`:
  - Host can delete without PIN
  - Non-host without PIN or wrong PIN gets 403 DomainError
  - Non-host with correct PIN can delete
  - Deleting non-existent session gets 404 DomainError
- [ ] Run test to verify failure (`npx vitest run src/test/order-session-core.test.ts`).
- [ ] Implement `deleteSession(rawInput: DeleteOrderSessionInput): Promise<void>` in `src/server/services/order-session.service.ts`.
- [ ] Run tests and verify all pass.

### Task 3: API Route Handler

**Files:**
- Modify: `src/app/api/v1/sessions/[sessionId]/route.ts`

- [ ] Add `DELETE` method handler to `src/app/api/v1/sessions/[sessionId]/route.ts`.
- [ ] Validate request body with schema `{ actorUserId: string, pin?: string }`.
- [ ] Call `service.deleteSession` and return `apiSuccess({ success: true, deletedSessionId: sessionId })`.

### Task 4: Reusable Component `DeleteSessionButton`

**Files:**
- Create: `src/features/order-session/components/delete-session-button.tsx`
- Modify: `src/components/ui/index.ts` (if relevant)

- [ ] Create `DeleteSessionButton` component:
  - Props: `sessionId`, `hostUserId`, `currentUserId`, `storeDisplayName`, `variant` ('icon' | 'button'), `onSuccess?: () => void`, `className?: string`.
  - Determines if current user is Host (`currentUserId === hostUserId`).
  - If Host: triggers confirmation modal with warning.
  - If non-Host: triggers PIN modal with numeric/text password input and clear explanation.
  - Handles API mutation (`DELETE /api/v1/sessions/[sessionId]`) with loading indicators.
  - Shows error message if PIN is invalid.
  - On success: fires `onSuccess` callback.

### Task 5: Integration into Order Session Page & History Page

**Files:**
- Modify: `src/features/order-session/order-session-client.tsx`
- Modify: `src/features/order-session/order-history-client.tsx`

- [ ] In `src/features/order-session/order-session-client.tsx`:
  - Import and place `DeleteSessionButton` in the header action bar.
  - On success: redirect to `/history` with success toast.
- [ ] In `src/features/order-session/order-history-client.tsx`:
  - Import and place `DeleteSessionButton` in each session card (both OPEN and CLOSED sessions).
  - On success: invalidate `['session-history']` query and show toast.

### Task 6: End-to-End Verification

**Files:**
- Run full test suite: `npx vitest run`
- Verify TypeScript compilation: `npm run typecheck` (or `npx tsc --noEmit`)
