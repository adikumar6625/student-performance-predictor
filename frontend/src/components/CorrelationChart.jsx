import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FEATURE_CONFIG } from "../features";

export default function CorrelationChart({ correlations }) {
  if (!correlations) return null;

  const data = Object.entries(correlations)
    .map(([key, value]) => ({
      key,
      name: FEATURE_CONFIG[key]?.label ?? key,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <XAxis
          type="number"
          domain={[0, 1]}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--ink-line)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fill: "var(--text-primary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{ background: "var(--ink-panel-alt)", border: "1px solid var(--ink-line)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-primary)" }}
          formatter={(v) => [v, "correlation (r)"]}
        />
        <Bar dataKey="value" radius={4} barSize={14}>
          {data.map((d) => (
            <Cell key={d.key} fill="var(--amber)" fillOpacity={0.35 + Math.min(0.65, d.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
