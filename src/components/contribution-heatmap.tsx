import { todayKey } from "@/lib/tracker-store";

const WEEKS = 22;

function levelClass(score: number) {
  if (score <= 0) return "bg-muted";
  if (score <= 1) return "bg-heat-1";
  if (score <= 3) return "bg-heat-2";
  if (score <= 5) return "bg-heat-3";
  return "bg-heat-4";
}

export function ContributionHeatmap({
  dayScore,
  onSelect,
  selected,
}: {
  dayScore: (key: string) => number;
  onSelect: (key: string) => void;
  selected: string;
}) {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // end of current week (Sat)

  const columns: string[][] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const col: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(end);
      date.setDate(end.getDate() - w * 7 - (6 - d));
      col.push(todayKey(date));
    }
    columns.push(col);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1">
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-1">
              {col.map((key) => {
                const future = key > todayKey();
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !future && onSelect(key)}
                    aria-label={`${key}: ${dayScore(key)} points`}
                    className={`size-3.5 rounded-[3px] transition-transform ${
                      future ? "bg-muted/40" : levelClass(dayScore(key))
                    } ${selected === key ? "ring-2 ring-ring" : ""} active:scale-90`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <span className="size-3 rounded-[3px] bg-muted" />
        <span className="size-3 rounded-[3px] bg-heat-1" />
        <span className="size-3 rounded-[3px] bg-heat-2" />
        <span className="size-3 rounded-[3px] bg-heat-3" />
        <span className="size-3 rounded-[3px] bg-heat-4" />
        <span>More</span>
      </div>
    </div>
  );
}
