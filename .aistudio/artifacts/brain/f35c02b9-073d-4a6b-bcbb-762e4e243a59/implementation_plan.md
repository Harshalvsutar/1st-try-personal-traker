# FocusGrove: Study Log & Heatmap PDF Report, Custom Timer & Stopwatch

This update brings printable PDF reports for daily study progress and work activity heatmaps, dual-mode countdown & stopwatch tracking with lap logging, and persistent custom timer duration inputs.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the clarification interview:
>
> - **Report Export**: Printable PDF document export (using a dedicated high-fidelity print template and browser print-to-PDF flow) formatted for study history and activity heatmaps.
> - **Stopwatch Experience**: Dual timer modes directly on the Focus screen—switching smoothly between Pomodoro countdown (tree growth) and a precision count-up Stopwatch (with lap times and session logging).
> - **Custom Timer Setup**: An inline number input and increment/decrement steppers directly adjacent to the preset buttons (15m, 25m, 45m, 60m), allowing arbitrary minute values (1–180m) that persist across app launches.

---

### 1. Overview & Core Concept

- **What It Does**: FocusGrove enables students and knowledge workers to time focus sessions, build streaks, log study questions and topics, and inspect long-term activity in a contribution heatmap. This release adds a dedicated printable PDF report generator for study records and heatmaps, an integrated stopwatch with lap splits, and granular custom duration inputs with automatic local persistence.
- **Target Audience**: Students, self-learners, and professionals who need an offline-first tracker that respects privacy and provides clear exportable proof of study progress.
- **Key Value**: Users can record precise focus times (both fixed blocks and open-ended stopwatch sessions), tailor intervals to their exact study needs, and export polished PDF summaries for academic or personal records without needing an active internet connection.

---

### 2. User Experience & Visual Design

- **Focus Screen (Dual Modes)**:
  - **Mode Toggle**: Segmented pill control at the top: `[ Pomodoro ]` and `[ Stopwatch ]`.
  - **Pomodoro Mode**:
    - Central animated SVG growing tree with progress ring.
    - Large tabular monospaced countdown display (`MM:SS`).
    - Preset chips (`15m`, `25m`, `45m`, `60m`) plus an interactive custom input box with `−` and `+` steppers.
    - Start / Pause / Reset action buttons.
  - **Stopwatch Mode**:
    - Large elapsed time display (`HH:MM:SS.s` precision).
    - Dedicated action buttons: `Start` / `Pause`, `Lap`, `Reset`, and `Log Focus` (which saves elapsed minutes directly to the day's grove record).
    - Scrollable lap list showing split times and total duration.
- **Report & Export Center (Study / Grid Drawer)**:
  - In the Study screen options menu (and Dashboard), add **"Export PDF report"**.
  - Opens a clean report preview sheet / print view formatted for standard A4/Letter paper:
    - FocusGrove Header with report date range and user summary.
    - High-level metric tiles (Total Focus Sessions, Total Hours, Questions Solved, Completed Topics, Active Streak Days).
    - Rendered Activity Heatmap grid.
    - Chronological table of daily records (Date, Focus Minutes, Questions Solved, Topics Checklist).
    - Action button to trigger `window.print()` (which natively prints or saves as PDF).
- **Persistent Local Storage**:
  - Automatically saves custom timer duration, active mode, and all daily records to `localStorage` immediately upon changes.

---

### 3. Key Product Decisions & Trade-Offs

- **Printable PDF Export via CSS Print Styles & Window.print()**:
  - _Chosen Approach_: Implement a dedicated printable report layout with `@media print` rules, ensuring crisp vector rendering of the heatmap and typography when saving as PDF, avoiding bloated external PDF binary libraries (e.g. `jspdf` or `pdfmake`) that add significant bundle weight and degrade mobile performance.
  - _Why_: Delivers crisp vector output, respects device printing preferences, works 100% offline, and is fully compatible with both desktop and mobile Capacitor/WebView printing.
- **Dual Mode Focus Screen**:
  - _Chosen Approach_: Seamless tabbed switch between Pomodoro (countdown + growing tree) and Stopwatch (count-up + laps).
  - _Why_: Keeps the primary navigation focused (Focus, Grid, Study) while accommodating both structured interval study and open-ended focus work without cluttering the bottom navigation.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       FocusGrove App                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼──────────────────────┐
       ▼                       ▼                      ▼
┌──────────────┐       ┌───────────────┐      ┌───────────────┐
│ Focus Route  │       │  Grid Route   │      │  Study Route  │
│  - Pomodoro  │       │  - Heatmap    │      │  - Topics     │
│  - Stopwatch │       │  - Metrics    │      │  - Questions  │
│  - Stepper   │       │  - Date Range │      │  - PDF Report │
└──────┬───────┘       └───────┬───────┘      └───────┬───────┘
       │                       │                      │
       └───────────────────────┼──────────────────────┘
                               ▼
               ┌───────────────────────────────┐
               │    tracker-store (Context)    │
               │   - records (DayRecord)       │
               │   - timerMinutes (1-180m)     │
               │   - logSession()              │
               │   - saveDailyRecord()         │
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │  localStorage (Local Storage) │
               │   - focusgrove.data.v1        │
               │   - focusgrove.data.prev      │
               └───────────────────────────────┘
```

- **Data Models**:
  - `DayRecord`: `{ sessions: number; focusMinutes: number; questions: number; topics: Topic[] }`
  - `TrackerData`: Maintains `records`, `timerMinutes` (now accepting any integer 1–180), `personal`, `colorDays`, `reminder`, `lastBackup`.
- **Print Stylesheet (`print.css` / Tailwind `@media print`)**:
  - Hides bottom navigation, floating action buttons, sheets, and headers during printing.
  - Expands printable container to full page width with high-contrast text and clean page breaks.
