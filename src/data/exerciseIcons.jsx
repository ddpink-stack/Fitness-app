import { Dumbbell } from "lucide-react";

const paths = {
  "incline-pushup": (
    <>
      <line x1="14" y1="13.8" x2="20" y2="13.8" />
      <line x1="17" y1="13.8" x2="17" y2="16.5" />
      <circle cx="16.8" cy="9.8" r="1.4" />
      <line x1="16.6" y1="11.2" x2="16" y2="12.6" />
      <line x1="16" y1="12.6" x2="16.5" y2="13.8" />
      <line x1="16" y1="12.6" x2="8" y2="17" />
      <line x1="8" y1="17" x2="3" y2="20" />
    </>
  ),
  "dumbbell-bench-press": (
    <>
      <line x1="3" y1="18" x2="21" y2="18" />
      <circle cx="18" cy="16.5" r="1.5" />
      <line x1="16.5" y1="17" x2="7" y2="17" />
      <line x1="7" y1="17" x2="6" y2="20" />
      <line x1="6" y1="20" x2="2.5" y2="20" />
      <line x1="10" y1="17" x2="10" y2="8" />
      <line x1="14" y1="17" x2="14" y2="8" />
      <line x1="8.3" y1="8" x2="11.7" y2="8" />
      <line x1="12.3" y1="8" x2="15.7" y2="8" />
    </>
  ),
  "shoulder-press": (
    <>
      <circle cx="12" cy="5" r="1.5" />
      <line x1="12" y1="6.6" x2="12" y2="13" />
      <line x1="12" y1="13" x2="9.5" y2="20" />
      <line x1="12" y1="13" x2="14.5" y2="20" />
      <line x1="12" y1="8" x2="8.5" y2="3.5" />
      <line x1="12" y1="8" x2="15.5" y2="3.5" />
      <line x1="7" y1="3.5" x2="10" y2="3.5" />
      <line x1="14" y1="3.5" x2="17" y2="3.5" />
    </>
  ),
  "barbell-bench-press": (
    <>
      <line x1="3" y1="18" x2="21" y2="18" />
      <circle cx="18" cy="16.5" r="1.5" />
      <line x1="16.5" y1="17" x2="7" y2="17" />
      <line x1="7" y1="17" x2="6" y2="20" />
      <line x1="6" y1="20" x2="2.5" y2="20" />
      <line x1="11" y1="17" x2="11" y2="8" />
      <line x1="13" y1="17" x2="13" y2="8" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <line x1="7" y1="6.5" x2="7" y2="9.5" />
      <line x1="17" y1="6.5" x2="17" y2="9.5" />
    </>
  ),
  "dumbbell-row": (
    <>
      <line x1="2" y1="15.5" x2="8" y2="15.5" />
      <circle cx="15.5" cy="8.5" r="1.5" />
      <line x1="14.3" y1="9.8" x2="7" y2="14" />
      <line x1="7" y1="14" x2="4" y2="15.5" />
      <line x1="7" y1="14" x2="9" y2="21" />
      <line x1="14.3" y1="9.8" x2="18" y2="15" />
      <line x1="18" y1="15" x2="19" y2="21" />
      <line x1="12" y1="11" x2="16" y2="16" />
    </>
  ),
  "bodyweight-row": (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="4.5" y1="6" x2="4.5" y2="4" />
      <line x1="19.5" y1="6" x2="19.5" y2="4" />
      <circle cx="17" cy="12" r="1.5" />
      <line x1="15.8" y1="13.3" x2="12" y2="6.3" />
      <line x1="15.8" y1="13.3" x2="8" y2="17" />
      <line x1="8" y1="17" x2="4" y2="19.5" />
    </>
  ),
  "lat-pulldown": (
    <>
      <line x1="5" y1="3" x2="19" y2="3" />
      <line x1="7" y1="3" x2="7" y2="4.5" />
      <line x1="17" y1="3" x2="17" y2="4.5" />
      <line x1="7" y1="4.5" x2="10.5" y2="9" />
      <line x1="17" y1="4.5" x2="13.5" y2="9" />
      <circle cx="12" cy="6.8" r="1.4" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="14" x2="17" y2="14" />
    </>
  ),
  "bent-over-row": (
    <>
      <circle cx="16" cy="7" r="1.5" />
      <line x1="14.9" y1="8.3" x2="8" y2="13.5" />
      <line x1="8" y1="13.5" x2="5" y2="15" />
      <line x1="8" y1="13.5" x2="10" y2="21" />
      <line x1="11.5" y1="10" x2="6" y2="16" />
      <line x1="4" y1="16" x2="8" y2="16" />
    </>
  ),
  "goblet-squat": (
    <>
      <line x1="4" y1="21" x2="20" y2="21" />
      <circle cx="12" cy="7.5" r="1.6" />
      <line x1="12" y1="9.1" x2="12" y2="13" />
      <line x1="12" y1="13" x2="8" y2="21" />
      <line x1="12" y1="13" x2="16" y2="21" />
      <line x1="12" y1="10.5" x2="9.5" y2="13.5" />
      <line x1="12" y1="10.5" x2="14.5" y2="13.5" />
      <circle cx="12" cy="14" r="1.3" />
    </>
  ),
  "bodyweight-squat": (
    <>
      <circle cx="12" cy="6" r="1.5" />
      <line x1="12" y1="7.6" x2="12" y2="12" />
      <line x1="12" y1="9" x2="17" y2="9.5" />
      <line x1="12" y1="9" x2="17" y2="11.5" />
      <line x1="12" y1="12" x2="9" y2="15.5" />
      <line x1="9" y1="15.5" x2="9.5" y2="20" />
      <line x1="12" y1="12" x2="15" y2="15.5" />
      <line x1="15" y1="15.5" x2="14.5" y2="20" />
    </>
  ),
  lunges: (
    <>
      <line x1="2" y1="21" x2="9" y2="21" />
      <line x1="14" y1="21" x2="21" y2="21" />
      <circle cx="11" cy="6.5" r="1.6" />
      <line x1="11" y1="8.1" x2="11" y2="13.5" />
      <line x1="11" y1="13.5" x2="8" y2="17" />
      <line x1="8" y1="17" x2="8" y2="21" />
      <line x1="11" y1="13.5" x2="16" y2="16" />
      <line x1="16" y1="16" x2="14" y2="21" />
      <line x1="10" y1="9" x2="7" y2="11" />
      <line x1="10" y1="9" x2="13" y2="7" />
    </>
  ),
  "leg-press": (
    <>
      <line x1="4" y1="19" x2="8" y2="10.5" />
      <circle cx="7.6" cy="9" r="1.4" />
      <line x1="7.3" y1="11.4" x2="7" y2="15" />
      <line x1="7" y1="15" x2="13" y2="14.5" />
      <line x1="13" y1="14.5" x2="18" y2="10" />
      <line x1="18" y1="7" x2="18" y2="15" />
    </>
  ),
  plank: (
    <>
      <line x1="21" y1="17.5" x2="19" y2="17.5" />
      <circle cx="18" cy="14.5" r="1.5" />
      <line x1="16.8" y1="15.3" x2="4" y2="18.5" />
      <line x1="16.8" y1="16" x2="17.5" y2="17.5" />
      <line x1="4" y1="18.5" x2="3" y2="21" />
    </>
  ),
  "russian-twist": (
    <>
      <circle cx="7.3" cy="9.3" r="1.4" />
      <line x1="7.5" y1="10.7" x2="8" y2="18" />
      <line x1="8" y1="18" x2="13" y2="16" />
      <line x1="13" y1="16" x2="17.5" y2="18" />
      <line x1="7.8" y1="13" x2="14" y2="15" />
    </>
  )
};

export function ExerciseIcon({ id, size = 28, color = "currentColor", strokeWidth = 1.6 }) {
  const path = paths[id];
  if (!path) return <Dumbbell size={size} color={color} strokeWidth={2} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
