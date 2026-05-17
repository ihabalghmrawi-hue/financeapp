# Construction Module — Improvement Roadmap

> **Target:** `financeapp` construction module  
> **Seed data:** 8 projects, 15 workers, 29 tasks, 42 expenses, 35 materials, 34 payments, 9 files  
> **Status:** Full CRUD exists, gaps in UX, performance, and construction-specific workflows

---

## Phase 1 — Quick Wins (Week 1)

| #   | Task                                                                          | Files Affected                                                                              | Effort | Impact                       |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| 1   | Add React Error Boundaries to all client pages                                | Each `*-client.tsx` under `src/app/dashboard/construction/`                                 | ~1h    | Prevents full-page crashes   |
| 2   | Replace spinners with loading skeletons                                       | Same client components + server page wrappers                                               | ~2h    | Better perceived performance |
| 3   | Extract shared TypeScript types                                               | Create `src/types/construction.ts`, update 7+ components                                    | ~1h    | Eliminates type drift        |
| 4   | Add CSV/Excel export to Payments, Expenses, Materials, Projects tables        | `payments-client.tsx`, `expenses-client.tsx`, `materials-client.tsx`, `projects-client.tsx` | ~3h    | User-requested feature       |
| 5   | Add proper pagination/infinite scroll on tasks, expenses, payments, materials | Server components `page.tsx` + client components                                            | ~4h    | Scales beyond 20-50 limit    |

### Details

#### 1.1 Error Boundaries

```tsx
// src/components/ui/error-boundary.tsx
'use client'
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 text-center">
            <p className="text-destructive font-medium">حدث خطأ غير متوقع</p>
            <button onClick={() => this.setState({ hasError: false })} className="text-sm text-primary underline mt-2">
              إعادة المحاولة
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
```

Wrap each section in every client component:

```tsx
<ErrorBoundary>
  <ProjectListSection />
</ErrorBoundary>
```

#### 1.2 Loading Skeletons

Create `src/components/ui/skeleton.tsx` (if not already present with table/card variants).

Replace every `loading ? <Spinner />` pattern with skeleton placeholders matching the layout (card grid skeleton, table
row skeleton, KPI card skeleton).

#### 1.3 Shared Types

```tsx
// src/types/construction.ts
export interface ConstructionProject {
  id: string
  company_id: string
  name: string
  description: string | null
  client_name: string | null
  client_phone: string | null
  location: string | null
  type: 'apartment' | 'villa' | 'shop' | 'office' | 'other'
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  engineer_name: string | null
  start_date: string | null
  end_date: string | null
  budget: number
  expected_cost: number
  actual_cost: number
  contract_value: number
  progress_pct: number
  // ...
}

export interface ConstructionWorker {
  /* ... */
}
export interface ConstructionTask {
  /* ... */
}
export interface ConstructionExpense {
  /* ... */
}
export interface ConstructionMaterial {
  /* ... */
}
export interface ConstructionPayment {
  /* ... */
}
export interface ConstructionFile {
  /* ... */
}
```

Update all `*-client.tsx` to import these instead of inline interfaces.

#### 1.4 CSV Export

Add a utility:

```tsx
// src/lib/export-csv.ts
export function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string,
) {
  /* ... */
}
```

Add an "تصدير Excel" button to each list page header.

#### 1.5 Pagination

Pattern for server components:

```tsx
const page = searchParams.page ? parseInt(searchParams.page) : 1
const PAGE_SIZE = 20

const { data, count } = await admin
  .from('con_tasks')
  .select('*', { count: 'exact' })
  .eq('company_id', COMPANY)
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  .order('created_at', { ascending: false })
```

Pass `page`, `totalPages`, `count` to client and render pagination controls.

---

## Phase 2 — UX & Visualization (Week 2)

| #   | Task                                           | Files Affected                                                | Effort | Impact             |
| --- | ---------------------------------------------- | ------------------------------------------------------------- | ------ | ------------------ |
| 6   | Budget vs Actual chart on project detail       | `project-detail-client.tsx`                                   | ~2h    | Visual insight     |
| 7   | Gantt / Timeline view for projects             | New `src/components/construction/gantt-chart.tsx` + route     | ~6h    | High-value feature |
| 8   | Bulk operations (select + batch update/delete) | All `*-client.tsx` list pages                                 | ~4h    | Productivity       |
| 9   | Real file uploads via Supabase Storage         | `files-client.tsx` + `api/construction/files/upload/route.ts` | ~3h    | Actual utility     |

### Details

#### 2.1 Budget vs Actual Chart

Add a simple Recharts `BarChart` to the Contract/Financial tab in `project-detail-client.tsx`:

```tsx
const budgetData = [
  { name: 'الميزانية', value: expected_cost },
  { name: 'المنصرف', value: actual_cost },
  { name: 'المتبقي', value: Math.max(0, expected_cost - actual_cost) },
]
```

#### 2.2 Gantt Chart

Build a lightweight Gantt using CSS grids + absolute positioning:

- X-axis = timeline (weeks/months)
- Y-axis = tasks grouped by project
- Bars = task duration (start_date → due_date)
- Color by status

Or integrate a library like `@dhtmlx/timeline` or build a custom one with divs and `left`/`width` percentage
calculations.

#### 2.3 Bulk Operations

Add checkboxes to each table row:

```tsx
const [selected, setSelected] = useState<Set<string>>(new Set())

// "تحديد الكل" checkbox in header
// Batch action bar that appears when selection > 0
// Actions: تغيير الحالة, حذف المحدد, تغيير الأولوية, تعيين مشرف
```

#### 2.4 Real File Uploads

Create:

```
src/app/api/construction/files/upload/route.ts → POST (multipart form → Supabase Storage)
```

Update `files-client.tsx` to use file input + upload progress instead of manual URL entry.

---

## Phase 3 — Construction-Specific Workflows (Week 3–4)

| #   | Task                                  | Files Affected                            | Effort | Impact        |
| --- | ------------------------------------- | ----------------------------------------- | ------ | ------------- |
| 10  | Worker attendance / timesheet system  | New `con_worker_logs` table + UI + API    | ~6h    | Core feature  |
| 11  | Purchase order workflow for materials | New tables + `purchase-orders` route + UI | ~8h    | Procurement   |
| 12  | Daily progress reports with photos    | New `con_daily_logs` table + UI           | ~4h    | Site tracking |
| 13  | Change order management               | New `con_change_orders` table + UI        | ~4h    | Scope mgmt    |

### Details

#### 3.1 Worker Attendance

Add table:

```sql
CREATE TABLE con_worker_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES con_projects(id) ON DELETE CASCADE,
  worker_id     UUID NOT NULL REFERENCES con_workers(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  days_worked   NUMERIC(3,1) NOT NULL DEFAULT 1,
  amount_paid   NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_con_worker_logs_company ON con_worker_logs(company_id, log_date DESC);
CREATE INDEX idx_con_worker_logs_worker  ON con_worker_logs(worker_id);
CREATE INDEX idx_con_worker_logs_project ON con_worker_logs(project_id);
```

UI: Calendar-based attendance grid (date rows × worker columns) with check-in/check-out times and auto-calculated
`amount_paid = days_worked × daily_rate`.

#### 3.2 Purchase Orders

Tables:

```sql
CREATE TABLE con_purchase_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES con_projects(id) ON DELETE CASCADE,
  supplier      TEXT NOT NULL,
  order_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status        TEXT NOT NULL DEFAULT 'pending',
  total         NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE con_purchase_order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES con_purchase_orders(id) ON DELETE CASCADE,
  material_name   TEXT NOT NULL,
  quantity        NUMERIC(15,3) NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'unit',
  unit_price      NUMERIC(15,2) NOT NULL,
  total           NUMERIC(15,2) NOT NULL
);
```

Workflow: Draft → Sent → Partially Received → Received → Cancelled

#### 3.3 Daily Progress Reports

```sql
CREATE TABLE con_daily_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES con_projects(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  weather       TEXT,
  workers_count INT NOT NULL DEFAULT 0,
  hours_worked  NUMERIC(4,1) NOT NULL DEFAULT 8,
  notes         TEXT,
  photo_urls    JSONB NOT NULL DEFAULT '[]',
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3.4 Change Orders

```sql
CREATE TABLE con_change_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES con_projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  amount_change   NUMERIC(15,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  approved_by     TEXT,
  approved_at     DATE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Phase 4 — Performance & Architecture (Week 4–5)

| #   | Task                                               | Files Affected                                         | Effort | Impact            |
| --- | -------------------------------------------------- | ------------------------------------------------------ | ------ | ----------------- |
| 14  | Fix `materialsAsExpenses` → dedicated API endpoint | `page.tsx` + new `api/construction/dashboard/route.ts` | ~2h    | Data integrity    |
| 15  | Selective `force-dynamic` → ISR + SWR caching      | `page.tsx` files + add SWR/React-Query                 | ~3h    | Performance       |
| 16  | Wire up Redis caching for construction queries     | `api/construction/*` + `src/lib/redis/`                | ~3h    | DB load reduction |
| 17  | Progressive loading with Suspense boundaries       | All server component pages                             | ~2h    | UX improvement    |
| 18  | Profitability by project type analysis             | Reports page + API                                     | ~2h    | Business insight  |

---

## Phase 5 — Admin & Cross-Cutting (Week 5–6)

| #   | Task                                        | Files Affected                          | Effort | Impact           |
| --- | ------------------------------------------- | --------------------------------------- | ------ | ---------------- |
| 19  | Equipment/machinery tracking                | New table + UI                          | ~4h    | Feature parity   |
| 20  | Subcontractor management                    | Extend suppliers or new table           | ~3h    | Feature parity   |
| 21  | Safety incident reporting                   | New table + UI                          | ~3h    | Compliance       |
| 22  | Notifications for budget overrun, deadlines | Notification system (exists) + triggers | ~3h    | Proactive alerts |

---

## Summary Timeline

```
Week 1  ████████████████░░░░░░░░░░░░░░░░  45%  Quick wins (error boundaries, skeletons, types, CSV, pagination)
Week 2  ████████████████████████░░░░░░░░  65%  Charts, Gantt, bulk ops, file uploads
Week 3  ████████████████████████████████░  90%  Attendance, purchase orders, daily logs, change orders
Week 4  ████████████████████████████████░  95%  Performance, architecture, Redis, caching
Week 5  ████████████████████████████████  100%  Equipment, subcontractors, safety, notifications
```

---

## Recommended Order of Execution

1. **Error boundaries + skeletons** — safety net first, then polish
2. **Shared types** — reduces merge conflicts and bugs in all subsequent work
3. **Pagination** — without it, seed data already exceeds limits
4. **CSV export** — easy win, high user value
5. **Budget chart + Gantt** — biggest visual impact
6. **Bulk operations** — daily driver productivity
7. **Worker attendance** — core construction workflow
8. **Real file uploads** — replaces placeholder system
9. **Performance** (API endpoint fix → Redis → caching)
10. **Remaining workflows** (purchase orders, change orders, equipment, etc.)

---

## Effort Estimate

| Phase                 | Estimated Hours | Dependencies                    |
| --------------------- | --------------- | ------------------------------- |
| Phase 1 — Quick Wins  | ~11h            | None                            |
| Phase 2 — UX & Viz    | ~15h            | Phase 1 (#3 types)              |
| Phase 3 — Workflows   | ~22h            | Phase 2 (#9 uploads for photos) |
| Phase 4 — Performance | ~12h            | None                            |
| Phase 5 — Admin       | ~13h            | Phase 2                         |

**Total: ~73 hours** (roughly 2–3 weeks full-time for one developer)
