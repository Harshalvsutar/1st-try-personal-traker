# Personal tab, colour-box day chart, reminders, 2-year reliability

## 1. New "Personal" tab (4th tab hidden in the study tab [open by taping on the corner 3 dot menue)

- Categories: Movies, Series, Books, Notes, Other (chips to filter).
- Add entry: title, category, date (defaults to today), optional rating (1-5) and note.
- List grouped by month, newest first; edit and delete; search box.

## 2. Study tab three-dots menu

A "..." button at the top of Study opens a menu with:

- **Date chart** – past days list showing topics done and questio ns solved per day.
- **Colour tracker** – one row per day:
  - Date shown as plain text, next to 4 boxes (red, green, blue, yellow).
  - Tapping a box toggles it filled with its colour (no fixed meaning).
  - Tapping the date expands the row: a note text box plus 2 checkboxes you can label and tick.
  - Scroll back through all past days.
- **Reminders** settings (see 3).
- **Backup** – export / import all data as a file.

## 3. Daily reminder

- Pick a time and turn on/off; asks for notification permission.
- Fires at that time while the app is open or running in background; if missed, shows a reminder banner next time you open the app that day.

## 4. Safe for 2+ years

- Versioned saved data with automatic upgrade of old records, so updates never wipe history.
- Every stored item checked on load; broken items skipped instead of crashing.
- Save errors (storage full) shown as a warning, plus a backup reminder monthly.
- Export/import backup file so data survives phone changes or browser clears.
- Request "persistent storage" from the browser so it is not auto-cleared.
- Heatmap and lists handle years of data without slowing down.

## Technical details

- Extend `tracker-store` data: `personal: Entry[]`, `colorDays: Record<date,{r,g,b,y,note,checks:[{label,done}x2]}>`, `reminder:{enabled,time,lastShown}`, `version`. Add migration function and zod validation per field.
- New route `src/routes/personal.tsx`; app-shell tabs grid-cols-4.
- Study: DropdownMenu -> Sheets for Date chart, Colour tracker, Reminders, Backup.
- Reminders: Notification API + interval check; SW `showNotification` when registered; fallback toast on open.
- `navigator.storage.persist()` on startup.
