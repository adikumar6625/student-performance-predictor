export const FEATURE_CONFIG = {
  hours_studied: {
    label: "Hours Studied / Week",
    unit: "hrs",
    min: 0,
    max: 12,
    step: 0.5,
    default: 5.5,
    field: "slider",
  },
  attendance_pct: {
    label: "Attendance",
    unit: "%",
    min: 40,
    max: 100,
    step: 1,
    default: 80,
    field: "slider",
  },
  previous_score: {
    label: "Previous Exam Score",
    unit: "%",
    min: 35,
    max: 100,
    step: 1,
    default: 65,
    field: "slider",
  },
  sleep_hours: {
    label: "Sleep / Night",
    unit: "hrs",
    min: 4,
    max: 9,
    step: 0.5,
    default: 6.5,
    field: "slider",
  },
  sample_papers_solved: {
    label: "Practice Papers Solved",
    unit: "papers",
    min: 0,
    max: 10,
    step: 1,
    default: 4,
    field: "slider",
  },
  extracurricular: {
    label: "Extracurricular Activities",
    unit: "",
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    field: "toggle",
  },
  parental_support: {
    label: "Parental Support",
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

export const defaultFormValues = () =>
  Object.fromEntries(
    Object.entries(FEATURE_CONFIG).map(([k, v]) => [k, v.default])
  );
