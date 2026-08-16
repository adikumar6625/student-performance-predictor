import { Bar, BarChart, Cell, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { FEATURE_CONFIG } from "../features";

export default function ContributionChart({ contributions, selectedFeatures }) {
  if (!contributions) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-[var(--text-muted)] font-mono-data">
        run a prediction to see the breakdown
      </div>
    );
  }

  const keys = selectedFeatures ?? Object.keys(contributions);
  const data = keys
    .map((key) => ({
      key,
      name: FEATURE_CONFIG[key]?.label ?? key,
      value: contributions[key] ?? 0,
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--ink-line)" }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fill: "var(--text-primary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine x={0} stroke="var(--ink-line)" />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{ background: "var(--ink-panel-alt)", border: "1px solid var(--ink-line)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-primary)" }}
          formatter={(v) => [`${v > 0 ? "+" : ""}${v} pts`, "contribution"]}
        />
        <Bar dataKey="value" radius={4} barSize={16}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.value >= 0 ? "var(--teal)" : "var(--red-ink)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
