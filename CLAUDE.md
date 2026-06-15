# WeekFlow — Claude Code Instructions

## Project Overview
WeekFlow is a personal activity tracker and performance app. Users plan weekly tasks, log daily life activities (movies, gaming, social events, etc.), track focus time, and receive an AI-generated graded weekly performance report. The report factors in both task completion AND daily journal entries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (SDK 51+) |
| Language | TypeScript (strict mode, no `any` types) |
| Navigation | Expo Router (file-based) |
| Database | Supabase (PostgreSQL + Auth + Edge Functions) |
| State | Zustand + Immer |
| AI Reports | Anthropic API via Supabase Edge Function (Deno) |
| Charts | Victory Native + react-native-svg |
| Animations | React Native Reanimated 2 |
| Storage | expo-secure-store (for session + local cache) |

---

## Folder Structure

```
weekflow/
├── app/                        ← Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx         ← Tab bar
│   │   ├── index.tsx           ← This Week screen
│   │   ├── journal.tsx         ← Daily Journal
│   │   ├── report.tsx          ← Weekly Report
│   │   ├── history.tsx         ← Past Weeks
│   │   └── dashboard.tsx       ← Trends & Streaks
│   ├── history/
│   │   └── [weekId].tsx        ← Past week drilldown
│   ├── settings.tsx
│   └── _layout.tsx             ← Root layout + auth gate
├── src/
│   ├── components/             ← Reusable UI components
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── weekStore.ts
│   │   ├── reportStore.ts
│   │   └── journalStore.ts
│   ├── lib/
│   │   ├── supabase.ts         ← Supabase client init
│   │   ├── api.ts              ← ALL Supabase query functions live here
│   │   └── constants.ts        ← Design system tokens
│   ├── types/
│   │   └── index.ts            ← All TypeScript types
│   ├── hooks/                  ← Custom React hooks
│   └── utils/
│       ├── weekUtils.ts
│       └── reportUtils.ts
├── supabase/
│   ├── migrations/
│   └── functions/
│       └── generate-report/
│           └── index.ts        ← Deno Edge Function
└── assets/
```

---

## Path Aliases

TypeScript path alias is configured: `@/*` maps to `./src/*`

Always import using aliases:
```typescript
// CORRECT
import { COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';

// WRONG
import { COLORS } from '../../lib/constants';
```

---

## Design System

All design tokens live in `src/lib/constants.ts`. Always import from there, never hardcode colours inline.

```typescript
// Background & Surface
BACKGROUND: '#0E0E17'
SURFACE: '#161622'
BORDER: 'rgba(255,255,255,0.08)'

// Text
TEXT_PRIMARY: '#FFFFFF'
TEXT_SECONDARY: 'rgba(255,255,255,0.6)'
TEXT_MUTED: 'rgba(255,255,255,0.3)'

// Accent
ACCENT: '#6366F1'
ACCENT_SECONDARY: '#8B5CF6'
PINK: '#EC4899'

// Status
SUCCESS: '#22C55E'
WARNING: '#F59E0B'
DANGER: '#EF4444'

// Category colours
CATEGORY_COLORS = {
  Work: '#6366F1',
  Health: '#EC4899',
  Personal: '#14B8A6',
  Learning: '#F97316',
  Other: '#8B5CF6'
}

// Priority colours
PRIORITY_COLORS = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22C55E'
}
```

---

## Database Schema

All tables have RLS enabled and are scoped by `user_id = auth.uid()`.

### Tables

**profiles** — `id` (uuid, FK auth.users), `display_name`, `notification_prefs` (jsonb), `created_at`

**weeks** — `id` (text, Monday ISO date e.g. `2025-05-19`), `user_id`, `label`, `intention`, `energy_start` (1–5), `energy_end` (1–5), `focus_hours` (numeric), `timer_running` (bool), `timer_started_at` (timestamptz), `report_generated` (bool), `created_at`

**tasks** — `id` (uuid), `week_id`, `user_id`, `title`, `category` (Work|Health|Personal|Learning|Other), `priority` (High|Medium|Low), `estimated_hours` (numeric), `done` (bool), `done_at`, `carried_over_from` (week_id), `created_at`

**daily_logs** — `id` (uuid), `week_id`, `user_id`, `log_date` (date), `content` (text, max 500 chars), `created_at`. UNIQUE on `(user_id, log_date)`

**reports** — `id` (uuid), `week_id` (unique), `user_id`, `overall_score` (int), `grade` (S|A|B|C|D), `headline`, `wins` (jsonb string[]), `improvements` (jsonb string[]), `capacity_insight`, `focus_suggestion`, `next_week_goal`, `motivational_note`, `raw_json` (jsonb), `created_at`

**streaks** — `user_id` (PK), `current_streak` (int), `longest_streak` (int), `last_qualifying_week` (week_id text), `updated_at`

**feature_flags** — `user_id`, `flag` (text), `enabled` (bool). PK is `(user_id, flag)`

---

## TypeScript Rules

- **No `any` types — ever.** Use `unknown` and narrow, or define a proper type.
- All types live in `src/types/index.ts` and are exported from there.
- Key types: `Profile`, `Week`, `Task`, `DailyLog`, `Report`, `Streak`, `FeatureFlag`
- Utility types: `TaskCategory`, `TaskPriority`, `WeekSummary`, `CreateTaskInput`, `UpdateTaskInput`
- All Supabase responses must be typed. Use the generated types.
- `tsconfig.json` has `strict: true` and `noImplicitAny: true`

---

## Supabase Rules

- The Supabase client is initialised once in `src/lib/supabase.ts` using `expo-secure-store` for session persistence.
- **ALL database queries go through `src/lib/api.ts`** — never query Supabase directly from a component or store. Stores call api.ts, components call stores.
- All api.ts functions return `{ data, error }` matching Supabase's response shape.
- The AI report Edge Function lives at `supabase/functions/generate-report/index.ts`. It is a Deno function. The `ANTHROPIC_API_KEY` is set as a Supabase secret — it is **never** in the codebase or committed to git.
- Edge Function is called via `supabase.functions.invoke('generate-report', { body: { weekId } })` from `src/lib/api.ts`.
- RLS is always on. Every table has a policy: `auth.uid() = user_id`.

---

## State Management Rules

- Zustand stores: `authStore`, `weekStore`, `reportStore`, `journalStore`
- All stores use **Immer** for immutable state updates.
- Stores update state **optimistically** — update local state first, then call the API, rollback on error.
- Stores never import from each other. If cross-store data is needed, do it in a component or hook.
- `weekStore` is the primary store — it holds `currentWeekId`, `weeks`, `tasks`.

### Zustand Selector Rules (React 19 + useSyncExternalStore)

Any selector that returns an **object or array** must be wrapped with `useShallow` from `zustand/react/shallow`. Without it, React 19's `useSyncExternalStore` detects a new reference on every render and throws a "Maximum update depth exceeded" / "getSnapshot should be cached" error.

```typescript
import { useShallow } from 'zustand/react/shallow';

// CORRECT — object and array selectors wrapped
const week  = useWeekStore(useShallow((s) => s.weeks[s.currentWeekId]));
const tasks = useWeekStore(useShallow((s) => s.tasks[s.currentWeekId] ?? []));
const logs  = useJournalStore(useShallow((s) => s.logs));

// WRONG — new [] created on every call, triggers infinite loop
const tasks = useWeekStore((s) => s.tasks[weekId] ?? []);
```

Selectors returning **primitives** (string, number, boolean) or **store action functions** do not need `useShallow` — they compare correctly with `===`.

---

## Week ID Convention

- A week is identified by its **Monday ISO date string**: e.g. `"2025-05-19"`
- All week ID logic lives in `src/utils/weekUtils.ts`
- `getWeekId(date?: Date): string` — call this everywhere you need the current week ID
- Never compute week boundaries inline in components

---

## Component Rules

- All shared UI components live in `src/components/`
- Core components: `AppText`, `AppCard`, `AppButton`, `AppInput`, `AppBadge`, `LoadingScreen`, `EmptyState`
- Always use `AppText` instead of raw `<Text>` — it applies the font and colour defaults
- Always use `AppButton` instead of raw `<TouchableOpacity>` for interactive elements
- Components receive typed props — no untyped prop objects
- Use `KeyboardAvoidingView` on any screen with a `TextInput`
- Use `SafeAreaView` from `react-native-safe-area-context` on all screens

---

## Navigation

- Expo Router (file-based). Route groups: `(auth)` and `(tabs)`.
- Auth gate is in `app/_layout.tsx` — checks Supabase session, redirects accordingly.
- Tab bar has 5 tabs: This Week, Journal, Report, History, Dashboard.
- Active tab accent colour: `#6366F1`
- Tab bar background: `#0E0E17`
- Dynamic route for history drilldown: `app/history/[weekId].tsx`

---

## Animations & Feedback

- Use **Reanimated 2** for all animations (not the basic Animated API)
- Task cards: fade + slide in with 50ms stagger on list load
- Report sections: 100ms sequential stagger on screen mount
- History cards: slide in from right
- Haptic feedback via `expo-haptics`:
  - Task tick-off → `light`
  - Generate Report button → `medium`
  - Carry-over confirmation → `success`
- Toast notifications via `react-native-toast-message` for success/error states

---

## AI Report — Edge Function Behaviour

The Edge Function at `supabase/functions/generate-report/index.ts`:
1. Authenticates via Supabase JWT in the `Authorization` header
2. Fetches: the week row, all tasks, all daily_logs for that week, last 4 weeks of reports
3. Builds a prompt including: week label, intention, energy start/end, focus hours, completion rate, task breakdown by category + priority, estimated vs actual hours, daily journal entries per day, last 4 weeks scores for trend
4. Calls Anthropic API (`claude-sonnet-4-20250514`)
5. Returns JSON with: `overallScore`, `grade`, `headline`, `wins`, `improvements`, `capacityInsight`, `focusSuggestion`, `nextWeekGoal`, `motivationalNote`, `dailyActivityInsight`, `priorityAnalysis`
6. Saves result to `reports` table and updates `streaks`

**Streak rule:** A week qualifies for the streak if completion rate ≥ 80%.

---

## Validation Rules

| Field | Max |
|---|---|
| Task title | 100 chars |
| Weekly intention | 200 chars |
| Daily journal entry | 500 chars |
| Focus hours increment | 0.5h steps |
| Energy check-in | 1–5 integer |

Always show character counters on text inputs that have limits.

---

## Error Handling

- Every screen is wrapped in a React error boundary that shows a friendly error card + retry button (never a blank crash)
- Offline state detected via `@react-native-community/netinfo` — show a banner when offline
- When offline: queue task toggles and journal saves in `expo-secure-store`, sync on reconnect
- If `loadCurrentWeek` fails: fall back to locally cached data, don't show an error screen
- If Edge Function fails: show a toast with the error, allow retry — do not navigate away

---

## Notifications

- Powered by `expo-notifications`
- Sunday 8pm: "Time to generate your WeekFlow report! 📊"
- Wednesday 7pm: "You're halfway through the week — how are your tasks going?"
- Notification preferences saved to `profiles.notification_prefs` (jsonb)
- Toggleable in `app/settings.tsx`

---

## Git & Environment

**Never commit:**
- `.env` or `.env.local`
- `supabase/.temp/`
- Any file containing `ANTHROPIC_API_KEY`

**Environment variables:**
- `EXPO_PUBLIC_SUPABASE_URL` — safe to commit in `.env.example`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — safe to commit in `.env.example`
- `ANTHROPIC_API_KEY` — lives ONLY in Supabase secrets manager, never in the repo

---

## Scaling Rules (baked in from Day 1)

These decisions are already made — do not change them:
- Every table has RLS scoped to `auth.uid() = user_id` — multi-user works automatically
- AI calls go through the Edge Function — API key is never client-side
- Zustand stores are structured around `userId` — swapping personal → multi-user is a config change
- `feature_flags` table exists — gate premium features with a DB row, no code changes needed

---

## Platform Notes

- expo-secure-store is native only. src/lib/supabase.ts uses Platform.OS === 'web' 
  check to fall back to localStorage on web.
- victory-native replaced with victory (web-compatible). 
  Import from 'victory' not 'victory-native'.
- Testing on web via npx expo start --web (localhost:8082)
- Package installs use --legacy-peer-deps flag due to peer dependency conflicts

---

## Do Not Do

- Do not query Supabase directly from components — always go through stores → api.ts
- Do not hardcode colours — always import from `@/lib/constants`
- Do not use `any` type
- Do not use raw `<Text>` or `<TouchableOpacity>` — use `AppText` and `AppButton`
- Do not use the basic React Native `Animated` API — use Reanimated 2
- Do not put `ANTHROPIC_API_KEY` anywhere in the codebase
- Do not use percentage widths in any chart or table — use DXA/pixel values
- Do not skip error boundaries on new screens
