import { FEATURE_CONFIG } from "./features";

export function buildRemark(grade, contributions) {
  if (!contributions) return "";

  const sorted = Object.entries(contributions).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const [topKey, topVal] = sorted[0];
  const weakest = [...sorted].reverse().find(([, v]) => v < 0);

  const topLabel = FEATURE_CONFIG[topKey]?.label ?? topKey;
  const openers = {
    "A+": "Outstanding work.",
    A: "Strong performance.",
    B: "Solid, steady effort.",
    C: "Room to grow.",
    D: "Needs attention.",
    F: "Significant improvement needed.",
  };

  let remark = `${openers[grade] ?? ""} ${topLabel} is doing the most work here (${topVal > 0 ? "+" : ""}${topVal} pts).`;

  if (weakest) {
    const weakLabel = FEATURE_CONFIG[weakest[0]]?.label ?? weakest[0];
    remark += ` ${weakLabel} is holding the score back — a good place to focus next.`;
  }

  return remark;
}
