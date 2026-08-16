export const FEATURE_CONFIG = {
  hours_studied: {
    label: "Hours Studied / Week",
    description: "Time spent studying outside class each week",
    unit: "hrs",
    min: 0,
    max: 12,
    step: 0.5,
    default: 5.5,
    field: "slider",
  },
  attendance_pct: {
    label: "Attendance",
    description: "Share of classes attended this term",
    unit: "%",
    min: 40,
    max: 100,
    step: 1,
    default: 80,
    field: "slider",
  },
  previous_score: {
    label: "Previous Exam Score",
    description: "Result from the last exam cycle",
    unit: "%",
    min: 35,
    max: 100,
    step: 1,
    default: 65,
    field: "slider",
  },
  sleep_hours: {
    label: "Sleep / Night",
    description: "Average hours of sleep per night",
    unit: "hrs",
    min: 4,
    max: 9,
    step: 0.5,
    default: 6.5,
    field: "slider",
  },
  sample_papers_solved: {
    label: "Practice Papers Solved",
    description: "Mock/sample papers completed before the exam",
    unit: "papers",
    min: 0,
    max: 10,
    step: 1,
    default: 4,
    field: "slider",
  },
  extracurricular: {
    label: "Extracurricular Activities",
    description: "Involved in clubs, sports, or similar activities",
    unit: "",
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    field: "toggle",
  },
  parental_support: {
    label: "Parental Support",
    description: "Level of support and involvement at home",
    unit: "",
    min: 1,
    max: 3,
    step: 1,
    default: 2,
    field: "select",
    options: [
      { value: 1, label: "Low" },
      { value: 2, label: "Medium" },
      { value: 3, label: "High" },
    ],
  },
};

export const ALL_FEATURE_KEYS = Object.keys(FEATURE_CONFIG);

export const defaultFormValues = () =>
  Object.fromEntries(
    Object.entries(FEATURE_CONFIG).map(([k, v]) => [k, v.default])
  );
