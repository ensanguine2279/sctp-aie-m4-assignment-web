import type { CountRow } from "@/lib/analytics";

/**
 * Chart colours. Checked with a colour-vision-deficiency validator against
 * the white card surface: both pass lightness, chroma, CVD separation and
 * 3:1 contrast. Bars are always labelled with their value as well, so colour
 * never carries meaning on its own.
 */
export const CHART_COLORS = {
  primary: "#2a78d6", // single-series bars, "Completed"
  secondary: "#eb6834", // "Not completed"
} as const;

function pluralise(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** A card wrapper shared by every chart on the analytics page. */
export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** The same numbers as a table, for screen readers and exact values. */
function TableView({
  rows,
  labelHeader,
}: {
  rows: CountRow[];
  labelHeader: string;
}) {
  return (
    <details className="mt-4 text-xs text-gray-600">
      <summary className="cursor-pointer select-none hover:text-gray-900">
        Show as table
      </summary>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-1.5 font-medium">{labelHeader}</th>
            <th className="py-1.5 font-medium text-right">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-gray-100">
              <td className="py-1.5">{row.label}</td>
              <td className="py-1.5 text-right font-mono">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/**
 * Horizontal bar chart for one series of counts. Server-rendered HTML, no
 * chart library: each bar's width is its share of the largest value.
 */
export function BarList({
  rows,
  labelHeader,
  emptyMessage = "No tasks yet.",
}: {
  rows: CountRow[];
  labelHeader: string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-gray-500">{emptyMessage}</p>;
  }

  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <>
      <ul className="space-y-2" aria-label={`Tasks by ${labelHeader.toLowerCase()}`}>
        {rows.map((row) => {
          const pct = (row.value / max) * 100;
          return (
            <li
              key={row.key}
              className="group grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 text-xs"
              title={`${row.label}: ${pluralise(row.value, "task")}`}
            >
              <span className="truncate text-gray-700">{row.label}</span>
              <span className="relative h-5 bg-gray-50">
                {row.value > 0 && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px] transition-opacity group-hover:opacity-80"
                    style={{
                      width: `max(${pct}%, 4px)`,
                      backgroundColor: CHART_COLORS.primary,
                    }}
                  />
                )}
              </span>
              <span className="text-right font-mono text-gray-900">
                {row.value}
              </span>
            </li>
          );
        })}
      </ul>
      <TableView rows={rows} labelHeader={labelHeader} />
    </>
  );
}

/**
 * Completed versus not completed: a headline percentage over a single
 * two-part bar, with a legend that repeats the counts.
 */
export function CompletionMeter({
  completed,
  open,
  completionRate,
}: {
  completed: number;
  open: number;
  completionRate: number;
}) {
  const total = completed + open;

  if (total === 0) {
    return <p className="text-xs text-gray-500">No tasks yet.</p>;
  }

  const segments = [
    { key: "completed", label: "Completed", value: completed, color: CHART_COLORS.primary },
    { key: "open", label: "Not completed", value: open, color: CHART_COLORS.secondary },
  ];

  return (
    <>
      <p className="text-3xl font-bold tracking-tight text-gray-900">
        {completionRate}%
        <span className="ml-2 text-xs font-normal text-gray-500">
          of {pluralise(total, "task")} completed
        </span>
      </p>

      {/* Two segments with a 2px gap so they stay distinct without colour. */}
      <div
        className="mt-4 flex h-6 gap-[2px]"
        role="img"
        aria-label={`${completed} completed, ${open} not completed`}
      >
        {segments
          .filter((s) => s.value > 0)
          .map((s, i, shown) => (
            <div
              key={s.key}
              className={`transition-opacity hover:opacity-80 ${
                i === 0 ? "rounded-l-[4px]" : ""
              } ${i === shown.length - 1 ? "rounded-r-[4px]" : ""}`}
              style={{
                flexGrow: s.value,
                flexBasis: 0,
                minWidth: "4px",
                backgroundColor: s.color,
              }}
              title={`${s.label}: ${pluralise(s.value, "task")}`}
            />
          ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-700">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center">
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
            <span className="ml-1.5 font-mono text-gray-900">{s.value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** A headline number. */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
