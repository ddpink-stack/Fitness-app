import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dumbbell, Utensils, Calendar, CalendarDays, TrendingUp, Flame, Info, Video, RefreshCw,
  Lightbulb, ChevronRight, ChevronDown, ChevronUp, CircleCheck, Target, Activity,
  CheckCircle2, Search, X, Minus, Plus, MessageCircle, BarChart3, Droplets,
  Cookie, MoonStar, Footprints, Pencil, Timer, Camera, RotateCcw,
  Trophy, History, Sunrise, Sun, Moon, GlassWater, PartyPopper, Wind, Zap
} from "lucide-react";
import Questionnaire from "./components/Questionnaire.jsx";
import { generateWeekPlan, computeWeightsBySet, getSwapPool } from "./lib/planGenerator.js";
import { availableEquipment, categoryPurpose } from "./data/exercises.js";
import { foodDatabase, genericFoodCategories } from "./data/foods.js";
import { ExerciseIcon } from "./data/exerciseIcons.jsx";
import { goalMealHints } from "./data/meals.js";

const PROFILE_KEY = "fitness-app:profile";
const PROGRESS_KEY = "fitness-app:progress";
const HISTORY_KEY = "fitness-app:history";
const SWAPS_KEY = "fitness-app:swaps";
const CUSTOM_DAYS_KEY = "fitness-app:customDays";
const FOOD_LOG_KEY = "fitness-app:foodLog";
const WEIGHT_MEMORY_KEY = "fitness-app:weightMemory";
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_ICONS = { Breakfast: Sunrise, Lunch: Sun, Dinner: Moon, "Pre Workout": Zap, "Post Workout": GlassWater };

// Shared design tokens — CSS custom properties (defined in index.css)
// so the whole app follows the system light/dark setting automatically,
// the way a native iOS app does, instead of one hardcoded palette.
const C = {
  bg: "var(--bg)",
  headerGrad: "var(--header-grad)",
  card: "var(--card)",
  cardDone: "var(--card-done)",
  inset: "var(--inset)",
  border: "var(--border)",
  borderDone: "var(--border-done)",
  text: "var(--text)",
  textDim: "var(--text-dim)",
  textFaint: "var(--text-faint)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  accentBg: "var(--accent-bg)",
  success: "var(--success)",
  successBright: "var(--success-bright)",
  successBg: "var(--success-bg)",
  danger: "var(--danger)",
  dangerBg: "var(--danger-bg)",
  warn: "var(--warn)",
  warnBg: "var(--warn-bg)",
  tabBarBg: "var(--tabbar-bg)",
  shadow: "var(--shadow)"
};
const RADIUS = { card: 20, control: 14, pill: 999, chip: 12 };
const CARD = { background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, padding: 20, marginBottom: 16 };
const TAB_BAR_HEIGHT = 78;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isSameCalendarDay(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function getInitials(name) {
  if (!name || !name.trim()) return "";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Downscales an uploaded photo to a small square before storing it as a
// data URL in localStorage — an untouched phone photo would blow the
// storage quota fast.
function resizeImageFile(file, maxSize, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        }
      } else if (height > maxSize) {
        width = Math.round(width * (maxSize / height));
        height = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      onDone(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

const PROFILE_FIELD_OPTIONS = {
  goal: [
    { value: "fat-loss", label: "Fat Loss" },
    { value: "muscle-gain", label: "Muscle Gain" },
    { value: "general-fitness", label: "General Fitness" }
  ],
  level: [
    { value: "beginner", label: "Beginner" },
    { value: "returning", label: "Returning After a Break" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ],
  daysPerWeek: [
    { value: 3, label: "3 days" },
    { value: 4, label: "4 days" },
    { value: 5, label: "5 days" }
  ],
  equipment: [
    { value: "bodyweight", label: "Bodyweight" },
    { value: "dumbbell", label: "Dumbbells" },
    { value: "gym", label: "Full gym" }
  ],
  sex: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unspecified", label: "Prefer not to say" }
  ],
  diet: [
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "nonveg", label: "Non-veg" }
  ]
};

function parseRestSeconds(restLabel) {
  const match = /(\d+)/.exec(restLabel || "");
  return match ? parseInt(match[1], 10) : 60;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private browsing, quota, etc.) — progress just won't persist
  }
}

// Small reusable secondary-action chip (Coach tip, Swap, Video, Mark all
// done, Edit Days, ...) so every button-with-icon in the app shares one
// consistent shape, size, and icon weight instead of each being bespoke.
function Chip({ icon: Icon, children, onClick, tone = "neutral", style }) {
  const tones = {
    neutral: { bg: C.inset, color: C.textDim, border: `1px solid ${C.border}` },
    accent: { bg: C.accentBg, color: C.accentSoft, border: "none" },
    success: { bg: C.successBg, color: C.successBright, border: "none" }
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: t.bg,
        border: t.border,
        color: t.color,
        borderRadius: RADIUS.chip,
        padding: "8px 13px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        ...style
      }}
    >
      {Icon && <Icon size={15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

// Small icon-only utility button (Info, Video, Swap, Coach tip on an
// exercise card) — a row of these reads as one compact toolbar instead
// of several full-size buttons competing for attention.
function IconButton({ icon: Icon, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: C.inset,
        border: `1px solid ${C.border}`,
        color: C.textDim,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      <Icon size={17} strokeWidth={2} />
    </button>
  );
}

// A modal sheet that slides up from the bottom (iOS-style) instead of
// expanding content inline and pushing the rest of the list down.
function BottomSheet({ title, onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}
      />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 420,
        maxHeight: "85vh",
        overflowY: "auto",
        background: C.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: `0 -12px 40px ${C.shadow}`,
        zIndex: 61,
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
          <div style={{ width: 36, height: 5, borderRadius: 99, background: C.border }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 4px" }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: C.inset, border: "none", color: C.text, width: 30, height: 30, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "12px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
          {children}
        </div>
      </div>
    </>
  );
}

function MealCard({ meal, icon: Icon, collapsible = false, defaultOpen = false, extraNote }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;
  return (
    <div style={CARD}>
      <div
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: collapsible ? "pointer" : "default" }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: "50%", background: C.accentBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <Icon size={19} color={C.accentSoft} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{meal.time}</div>
          <div style={{ fontSize: 13, color: C.accentSoft, marginTop: 1 }}>{meal.time_label}</div>
        </div>
        {collapsible && (isOpen ? <ChevronUp size={18} color={C.textDim} /> : <ChevronDown size={18} color={C.textDim} />)}
      </div>
      {isOpen && (
        <div style={{ marginTop: 12 }}>
          {meal.options.map((opt, j) => (
            <div key={j} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "8px 0",
              fontSize: 15,
              color: C.text,
              borderTop: j > 0 ? `1px solid ${C.border}` : "none"
            }}>
              <span style={{ color: C.accentSoft, marginTop: 2 }}>◆</span>
              {opt}
            </div>
          ))}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginTop: 12,
            padding: "10px 14px",
            background: C.inset,
            borderRadius: RADIUS.chip,
            fontSize: 13,
            color: C.textDim
          }}>
            <MessageCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {meal.note}
          </div>
          {extraNote && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 8,
              padding: "10px 14px",
              background: C.accentBg,
              borderRadius: RADIUS.chip,
              fontSize: 13,
              color: C.accentSoft,
              fontWeight: 600
            }}>
              <Target size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {extraNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeightEditSheet({ sheet, hasOverride, onSave, onReset, onClose }) {
  const [value, setValue] = useState(sheet.currentText);
  return (
    <BottomSheet title={`${sheet.ex.name} — Set ${sheet.setIndex + 1}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: C.textDim, marginBottom: 14, lineHeight: 1.55 }}>
        Not the right weight? Enter what you actually used — we'll remember it for this exercise from now on.
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        style={{
          width: "100%",
          background: C.inset,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.chip,
          color: C.text,
          padding: 14,
          fontSize: 17,
          fontWeight: 700,
          boxSizing: "border-box"
        }}
      />
      <button
        onClick={() => onSave(value)}
        style={{
          marginTop: 14,
          width: "100%",
          background: C.accent,
          border: "none",
          borderRadius: RADIUS.chip,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          padding: "14px 20px",
          cursor: "pointer"
        }}
      >
        Save
      </button>
      {hasOverride && (
        <button
          onClick={onReset}
          style={{
            marginTop: 10,
            width: "100%",
            background: "none",
            border: "none",
            color: C.textDim,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: 8
          }}
        >
          Reset to suggested
        </button>
      )}
    </BottomSheet>
  );
}

function OnboardingLoader({ name, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "var(--bg)",
      minHeight: "100vh",
      color: "var(--text)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      boxSizing: "border-box",
      textAlign: "center"
    }}>
      <div style={{ position: "relative", width: 84, height: 84, marginBottom: 28 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.9s linear infinite"
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "pulse 1.4s ease-in-out infinite"
        }}>
          <Dumbbell size={32} color="var(--accent)" />
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3, marginBottom: 8, animation: "fadeInUp 0.5s ease" }}>
        {name ? `Tailoring a plan for ${name}` : "Tailoring your plan"}
      </div>
      <div style={{ fontSize: 14, color: "var(--text-dim)", animation: "fadeInUp 0.5s ease 0.1s both" }}>
        Personalizing your workouts and meals...
      </div>
    </div>
  );
}

export default function FitnessApp() {
  const [profile, setProfile] = useState(() => loadJSON(PROFILE_KEY, null));
  const [progress, setProgress] = useState(() => loadJSON(PROGRESS_KEY, {}));
  const [history, setHistory] = useState(() => loadJSON(HISTORY_KEY, []));
  const [swaps, setSwaps] = useState(() => loadJSON(SWAPS_KEY, {}));
  const [customDays, setCustomDays] = useState(() => loadJSON(CUSTOM_DAYS_KEY, null));
  const [foodLog, setFoodLog] = useState(() => loadJSON(FOOD_LOG_KEY, {}));
  const [weightMemory, setWeightMemory] = useState(() => loadJSON(WEIGHT_MEMORY_KEY, {})); // { [exerciseId]: { [setIndex]: overrideText } }
  const [activeTab, setActiveTab] = useState("workout");
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [sheet, setSheet] = useState(null); // { type: "tip"|"video"|"info", ex, exUid }
  const [restTimer, setRestTimer] = useState(null); // { exUid, exName, total, secondsLeft }
  const [preFinishSnapshot, setPreFinishSnapshot] = useState(null); // { workoutId, completedSets } — lets "Finish Workout" be undone
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [draftDays, setDraftDays] = useState([]);
  const [foodQuery, setFoodQuery] = useState("");
  const [customFoodMode, setCustomFoodMode] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const avatarInputRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showOnboardingLoader, setShowOnboardingLoader] = useState(false);

  const plan = useMemo(() => {
    if (!profile) return null;
    const valid = customDays && customDays.length === profile.daysPerWeek ? customDays : null;
    return generateWeekPlan(profile, new Date(), valid);
  }, [profile, customDays]);

  useEffect(() => {
    if (plan && !selectedDayId) {
      setSelectedDayId(plan.trainingDays[0].id);
    }
  }, [plan, selectedDayId]);

  useEffect(() => {
    saveJSON(PROGRESS_KEY, progress);
  }, [progress]);

  useEffect(() => {
    saveJSON(HISTORY_KEY, history);
  }, [history]);

  useEffect(() => {
    saveJSON(SWAPS_KEY, swaps);
  }, [swaps]);

  useEffect(() => {
    saveJSON(CUSTOM_DAYS_KEY, customDays);
  }, [customDays]);

  useEffect(() => {
    saveJSON(FOOD_LOG_KEY, foodLog);
  }, [foodLog]);

  useEffect(() => {
    saveJSON(WEIGHT_MEMORY_KEY, weightMemory);
  }, [weightMemory]);

  useEffect(() => {
    if (!restTimer) return;
    if (restTimer.secondsLeft > 0) {
      const id = setTimeout(() => {
        setRestTimer((current) => (current ? { ...current, secondsLeft: current.secondsLeft - 1 } : current));
      }, 1000);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setRestTimer(null), 3000);
    return () => clearTimeout(id);
  }, [restTimer]);

  const workout = useMemo(() => {
    if (!plan) return null;
    return plan.trainingDays.find((d) => d.id === selectedDayId) ?? plan.trainingDays[0];
  }, [plan, selectedDayId]);

  const dayProgress = useMemo(() => {
    if (!workout) return { completedSets: {}, notes: "" };
    return progress[workout.id] ?? { completedSets: {}, notes: "" };
  }, [workout, progress]);

  // Applies any exercise swaps the user made for this day on top of the
  // generated plan (recomputing personalized weights for the swapped-in
  // move), then layers on any weights the user has manually corrected —
  // those take priority over the formula from here on for that exercise.
  const displayedWorkout = useMemo(() => {
    if (!workout || !profile) return workout;
    const daySwaps = swaps[workout.id] || {};
    const available = availableEquipment(profile.equipment);
    return {
      ...workout,
      exercises: workout.exercises.map((ex, i) => {
        let resolved = ex;
        const rotation = daySwaps[i] || 0;
        if (rotation !== 0) {
          const pool = getSwapPool(ex.category, available);
          if (pool.length > 1) {
            const baseIdx = pool.findIndex((p) => p.id === ex.id);
            const alt = pool[(baseIdx + rotation) % pool.length];
            if (alt && alt.id !== ex.id) {
              const weightsBySet = computeWeightsBySet(alt, ex.category, profile.level, ex.sets, profile);
              resolved = { ...alt, sets: ex.sets, rest: ex.rest, category: ex.category, weightsBySet };
            }
          }
        }
        const overrides = weightMemory[resolved.id];
        if (overrides && resolved.weightsBySet) {
          const weightsBySet = resolved.weightsBySet.map((w, si) => overrides[si] ?? w);
          resolved = { ...resolved, weightsBySet };
        }
        return resolved;
      })
    };
  }, [workout, swaps, profile, weightMemory]);

  const totalSets = useMemo(
    () => (displayedWorkout ? displayedWorkout.exercises.reduce((acc, ex) => acc + ex.sets, 0) : 0),
    [displayedWorkout]
  );
  // Counts only sets that belong to the exercises currently shown for this
  // day — a raw count over dayProgress.completedSets would also pick up
  // stale entries left behind by an exercise swap or plan regeneration
  // under the same day id, letting "done" exceed the real total.
  const doneSets = useMemo(() => {
    if (!displayedWorkout || !workout) return 0;
    let count = 0;
    displayedWorkout.exercises.forEach((ex, exIndex) => {
      const exUid = `${workout.id}-${ex.id}-${exIndex}`;
      for (let i = 1; i <= ex.sets; i++) {
        if (dayProgress.completedSets[`${exUid}-${i}`]) count++;
      }
    });
    return count;
  }, [displayedWorkout, workout, dayProgress]);
  const progressPct = totalSets ? Math.min(100, Math.round((doneSets / totalSets) * 100)) : 0;
  const preWorkoutMeal = plan ? plan.nutrition.find((m) => m.time === "Pre Workout") : null;
  const postWorkoutMeal = plan ? plan.nutrition.find((m) => m.time === "Post Workout") : null;

  // Captures the completedSets right before a day flips to 100%, no
  // matter what triggered it (a single set tap, "Mark all done" on the
  // last exercise, or the "Finish Workout" button) — so "Undo" always
  // has something to restore to when it was reached by mistake. Guarded
  // by prevWorkoutIdRef so switching to an already-finished day doesn't
  // mistake a day-change for a fresh completion and capture the wrong
  // day's sets.
  const prevCompletedSetsRef = useRef(dayProgress.completedSets);
  const prevWorkoutIdRef = useRef(workout ? workout.id : null);
  const wasCompleteRef = useRef(false);
  useEffect(() => {
    if (!workout) return;
    const sameDay = prevWorkoutIdRef.current === workout.id;
    if (sameDay && progressPct === 100 && !wasCompleteRef.current) {
      setPreFinishSnapshot({ workoutId: workout.id, completedSets: prevCompletedSetsRef.current });
    }
    wasCompleteRef.current = progressPct === 100;
    prevWorkoutIdRef.current = workout.id;
    prevCompletedSetsRef.current = dayProgress.completedSets;
  }, [progressPct, dayProgress, workout]);

  // Logs a completed workout to history once every set is done, upserting
  // by day+date so revisiting an already-finished day doesn't duplicate it.
  useEffect(() => {
    if (!displayedWorkout || totalSets === 0 || progressPct !== 100) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const entryKey = `${displayedWorkout.id}::${todayKey}`;
    const entry = {
      key: entryKey,
      completedAt: new Date().toISOString(),
      dayId: displayedWorkout.id,
      dayLabel: displayedWorkout.label,
      exercises: displayedWorkout.exercises.map((ex, exIndex) => {
        const exUid = `${displayedWorkout.id}-${ex.id}-${exIndex}`;
        const doneCount = Array.from({ length: ex.sets }, (_, i) => dayProgress.completedSets[`${exUid}-${i + 1}`])
          .filter(Boolean).length;
        return { id: ex.id, name: ex.name, weightsUsed: ex.weightsBySet ?? null, setsCompleted: doneCount, totalSets: ex.sets };
      })
    };
    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.key === entryKey);
      if (idx !== -1 && JSON.stringify(prev[idx]) === JSON.stringify(entry)) return prev;
      return idx === -1 ? [...prev, entry] : prev.map((h, i) => (i === idx ? entry : h));
    });
  }, [progressPct, displayedWorkout, dayProgress, totalSets]);

  if (!profile || !plan) {
    return (
      <Questionnaire
        onComplete={(answers) => {
          saveJSON(PROFILE_KEY, answers);
          setProfile(answers);
          setShowOnboardingLoader(true);
        }}
      />
    );
  }

  if (showOnboardingLoader) {
    return <OnboardingLoader name={profile.name} onDone={() => setShowOnboardingLoader(false)} />;
  }

  const retakeQuestionnaire = () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SWAPS_KEY);
    localStorage.removeItem(CUSTOM_DAYS_KEY);
    setProfile(null);
    setProgress({});
    setSwaps({});
    setCustomDays(null);
    setSelectedDayId(null);
    setRestTimer(null);
    setEditingSchedule(false);
  };

  const updateProfile = (patch) => {
    // Changing daysPerWeek swaps in a whole new split template — the same
    // day id can end up with a different category at the same exercise
    // slot, so any saved swap "rotation" for that slot would silently
    // apply to the wrong category. Clear swaps in that case; equipment/
    // level changes don't reshuffle slot categories, so those are safe.
    if (patch.daysPerWeek != null && patch.daysPerWeek !== profile?.daysPerWeek) {
      setSwaps({});
      saveJSON(SWAPS_KEY, {});
    }
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(PROFILE_KEY, next);
      return next;
    });
  };

  const pickAvatarFile = (file) => {
    if (!file) return;
    resizeImageFile(file, 160, (dataUrl) => updateProfile({ avatar: dataUrl }));
  };

  const swapExercise = (exIndex) => {
    setSwaps((prev) => {
      const dayKey = workout.id;
      const current = prev[dayKey] || {};
      return { ...prev, [dayKey]: { ...current, [exIndex]: (current[exIndex] || 0) + 1 } };
    });
  };

  const startEditingSchedule = () => {
    const current = plan.weekSchedule.map((d, i) => (d.active ? i : null)).filter((v) => v !== null);
    setDraftDays(current);
    setEditingSchedule(true);
  };

  const toggleDraftDay = (i) => {
    setDraftDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b)));
  };

  const saveSchedule = () => {
    if (draftDays.length !== profile.daysPerWeek) return;
    setCustomDays(draftDays);
    setEditingSchedule(false);
  };

  const todayFoodEntries = foodLog[todayKey()] ?? [];

  const addFoodEntry = (entry) => {
    setFoodLog((prev) => {
      const key = todayKey();
      const dayEntries = prev[key] ?? [];
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return { ...prev, [key]: [...dayEntries, { ...entry, id, qty: 1 }] };
    });
    setFoodQuery("");
    setCustomFoodMode(false);
    setCustomFoodForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  const removeFoodEntry = (id) => {
    setFoodLog((prev) => {
      const key = todayKey();
      return { ...prev, [key]: (prev[key] ?? []).filter((e) => e.id !== id) };
    });
  };

  const updateFoodQty = (id, delta) => {
    setFoodLog((prev) => {
      const key = todayKey();
      const dayEntries = prev[key] ?? [];
      return {
        ...prev,
        [key]: dayEntries.map((e) => (e.id === id ? { ...e, qty: Math.max(1, (e.qty || 1) + delta) } : e))
      };
    });
  };

  const applyCategoryEstimate = (cat) => {
    setCustomFoodForm((f) => ({
      ...f,
      calories: String(cat.calories),
      protein: String(cat.protein),
      carbs: String(cat.carbs),
      fat: String(cat.fat)
    }));
  };

  const submitCustomFood = () => {
    const calories = parseFloat(customFoodForm.calories);
    if (!customFoodForm.name.trim() || Number.isNaN(calories)) return;
    addFoodEntry({
      name: customFoodForm.name.trim(),
      calories,
      protein: parseFloat(customFoodForm.protein) || 0,
      carbs: parseFloat(customFoodForm.carbs) || 0,
      fat: parseFloat(customFoodForm.fat) || 0
    });
  };

  const foodMatches = foodQuery.trim().length > 0
    ? (() => {
        const q = foodQuery.trim().toLowerCase();
        return foodDatabase
          .filter((f) => f.name.toLowerCase().includes(q) || (f.keywords ?? []).some((k) => k.includes(q) || q.includes(k)))
          .slice(0, 6);
      })()
    : [];

  const foodTotals = todayFoodEntries.reduce(
    (acc, e) => {
      const qty = e.qty || 1;
      return {
        calories: acc.calories + (e.calories || 0) * qty,
        protein: acc.protein + (e.protein || 0) * qty
      };
    },
    { calories: 0, protein: 0 }
  );

  const goalLabels = { "fat-loss": "Fat Loss", "muscle-gain": "Muscle Gain", "general-fitness": "General Fitness" };

  const setDayProgress = (updater) => {
    setProgress((prev) => {
      const current = prev[workout.id] ?? { completedSets: {}, notes: "" };
      return { ...prev, [workout.id]: updater(current) };
    });
  };

  const startRestTimer = (exUid, exName, restLabel) => {
    const total = parseRestSeconds(restLabel);
    setRestTimer({ exUid, exName, total, secondsLeft: total });
  };

  const toggleSet = (exerciseId, setNum, exName, restLabel, isLastSet) => {
    const key = `${exerciseId}-${setNum}`;
    const wasDone = dayProgress.completedSets[key];
    setDayProgress((current) => ({
      ...current,
      completedSets: { ...current.completedSets, [key]: !current.completedSets[key] }
    }));
    if (!wasDone && !isLastSet) {
      startRestTimer(exerciseId, exName, restLabel);
    }
  };

  const completeAllSets = (exerciseId, count) => {
    setDayProgress((current) => {
      const completedSets = { ...current.completedSets };
      for (let i = 1; i <= count; i++) completedSets[`${exerciseId}-${i}`] = true;
      return { ...current, completedSets };
    });
  };

  const finishWorkout = () => {
    setDayProgress((current) => {
      const completedSets = { ...current.completedSets };
      displayedWorkout.exercises.forEach((ex, exIndex) => {
        const exUid = `${workout.id}-${ex.id}-${exIndex}`;
        for (let i = 1; i <= ex.sets; i++) completedSets[`${exUid}-${i}`] = true;
      });
      return { ...current, completedSets };
    });
    setRestTimer(null);
  };

  // Reverts whatever just marked this day 100% complete — a set tap,
  // "Mark all done", or the "Finish Workout" button — restoring exactly
  // the sets that were completed right before that happened.
  const undoFinishWorkout = () => {
    if (!preFinishSnapshot || preFinishSnapshot.workoutId !== workout.id) return;
    setDayProgress((current) => ({ ...current, completedSets: preFinishSnapshot.completedSets }));
    setPreFinishSnapshot(null);
  };

  const openSheet = (type, ex, exUid, extra = {}) => setSheet({ type, ex, exUid, ...extra });
  const closeSheet = () => setSheet(null);

  // Saves a user-corrected weight for one exercise+set slot; it's keyed by
  // exercise id (not the day), so the correction sticks the next time this
  // exercise shows up on any day, overriding the formula's suggestion.
  const saveWeightOverride = (exerciseId, setIndex, text) => {
    setWeightMemory((current) => ({
      ...current,
      [exerciseId]: { ...current[exerciseId], [setIndex]: text }
    }));
    closeSheet();
  };

  const resetWeightOverride = (exerciseId, setIndex) => {
    setWeightMemory((current) => {
      if (!current[exerciseId]) return current;
      const { [setIndex]: _removed, ...rest } = current[exerciseId];
      const next = { ...current, [exerciseId]: rest };
      if (Object.keys(rest).length === 0) delete next[exerciseId];
      return next;
    });
    closeSheet();
  };

  const tabs = [
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition", icon: Utensils },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp }
  ];

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: C.bg,
      minHeight: "100vh",
      color: C.text,
      maxWidth: 420,
      margin: "0 auto",
      position: "relative",
      paddingBottom: TAB_BAR_HEIGHT + 16
    }}>
      <div style={{
        background: C.headerGrad,
        padding: "26px 20px 24px",
        borderBottom: `1px solid ${C.border}`
      }}>
        <button
          onClick={() => setShowProfile(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            width: "100%"
          }}
        >
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt=""
              style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` }}
            />
          ) : (
            <div style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0
            }}>
              {getInitials(profile.name) || <Dumbbell size={19} color="#fff" />}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
              Hey{profile.name ? `, ${profile.name}` : ""} 👋
            </div>
            <div style={{ fontSize: 13, color: C.textFaint, marginTop: 2 }}>Tap to view or edit your profile</div>
          </div>
          <ChevronRight size={18} color={C.textFaint} />
        </button>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 16, paddingBottom: 2 }}>
          {plan.trainingDays.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDayId(d.id)}
              style={{
                flexShrink: 0,
                padding: "10px 18px",
                borderRadius: RADIUS.pill,
                border: d.id === workout.id ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                background: d.id === workout.id ? C.accentBg : "transparent",
                color: d.id === workout.id ? C.accentSoft : C.textDim,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {d.dateLabel}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 24 }}>
          {isSameCalendarDay(workout.date) && <Flame size={14} color={C.accentSoft} />}
          <div style={{ fontSize: 12, color: C.accentSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
            {isSameCalendarDay(workout.date) ? "Today's Workout" : "Your Workout"}
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, marginTop: 6, lineHeight: 1.15 }}>{workout.label}</div>
        <div style={{ fontSize: 15, color: C.textDim, marginTop: 4, fontWeight: 500 }}>{workout.dateLabel}</div>

        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: C.textDim, fontWeight: 500 }}>{doneSets}/{totalSets} sets done</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: progressPct === 100 ? C.successBright : C.accentSoft }}>{progressPct}%</span>
          </div>
          <div style={{ background: C.inset, borderRadius: RADIUS.pill, height: 10 }}>
            <div style={{
              background: progressPct === 100 ? C.success : C.accent,
              width: `${progressPct}%`,
              height: "100%",
              borderRadius: RADIUS.pill,
              transition: "width 0.4s ease"
            }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {activeTab === "workout" && (
          <div>
            {preWorkoutMeal && (
              <MealCard meal={preWorkoutMeal} icon={MEAL_ICONS["Pre Workout"] ?? Zap} collapsible />
            )}

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Flame size={20} color={C.warn} />
                <span style={{ fontWeight: 700, fontSize: 17 }}>Warm Up — 5 min</span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.warn,
                  background: C.warnBg,
                  padding: "4px 10px",
                  borderRadius: RADIUS.pill
                }}>
                  Required
                </span>
              </div>
              {["3 min easy treadmill walk (flat)", "10 arm circles each direction", "10 bodyweight squats"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 15, color: C.text }}>
                  <span style={{ color: C.accentSoft, fontSize: 8 }}>●</span> {item}
                </div>
              ))}
            </div>

            {displayedWorkout.exercises.map((ex, exIndex) => {
              const exUid = `${workout.id}-${ex.id}-${exIndex}`;
              const allSetsForEx = Array.from({ length: ex.sets }, (_, i) => `${exUid}-${i + 1}`);
              const doneCount = allSetsForEx.filter(k => dayProgress.completedSets[k]).length;
              const exDone = doneCount === ex.sets;
              return (
                <div key={exUid} style={{
                  background: exDone ? C.cardDone : C.card,
                  border: `1px solid ${exDone ? C.borderDone : C.border}`,
                  borderRadius: RADIUS.card,
                  padding: 20,
                  marginBottom: 16,
                  transition: "all 0.3s"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <div style={{ flexShrink: 0, color: C.accentSoft }}>
                      <ExerciseIcon id={ex.id} size={30} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.accentSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                        {exIndex + 1} of {displayedWorkout.exercises.length}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 8, lineHeight: 1.3 }}>
                        {ex.name}
                        {exDone && <CircleCheck size={17} color={C.successBright} />}
                      </div>
                      <div style={{ fontSize: 14, color: C.textDim, marginTop: 4 }}>
                        {ex.sets} sets · {ex.reps} · {ex.rest}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    background: C.inset,
                    borderRadius: RADIUS.chip,
                    padding: "12px 14px",
                    fontSize: 14,
                    color: C.textDim,
                    marginBottom: 14,
                    lineHeight: 1.55
                  }}>
                    <Lightbulb size={16} color={C.warn} style={{ flexShrink: 0, marginTop: 2 }} />
                    {ex.cue}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const key = `${exUid}-${i + 1}`;
                      const done = dayProgress.completedSets[key];
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                          <button
                            onClick={() => toggleSet(exUid, i + 1, ex.name, ex.rest, i === ex.sets - 1)}
                            style={{
                              width: "100%",
                              padding: "15px 0",
                              borderRadius: RADIUS.control,
                              border: done ? "none" : `1px solid ${C.border}`,
                              background: done ? C.accent : C.inset,
                              color: done ? "#fff" : C.textDim,
                              fontWeight: 700,
                              fontSize: 16,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxSizing: "border-box"
                            }}
                          >
                            {done ? <CircleCheck size={18} /> : `Set ${i + 1}`}
                          </button>
                          {ex.weightsBySet && (
                            <button
                              onClick={() => openSheet("weight", ex, exUid, { setIndex: i, currentText: ex.weightsBySet[i] })}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "2px 0",
                                fontSize: 11,
                                fontWeight: 600,
                                color: C.accentSoft,
                                cursor: "pointer",
                                textDecoration: "underline",
                                textDecorationStyle: "dotted",
                                textUnderlineOffset: 2
                              }}
                            >
                              {ex.weightsBySet[i]}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!exDone && (
                    <button
                      onClick={() => completeAllSets(exUid, ex.sets)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "none",
                        border: "none",
                        color: C.successBright,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                        marginBottom: 16
                      }}
                    >
                      <CircleCheck size={14} /> Mark all done
                    </button>
                  )}

                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => openSheet("info", ex, exUid)}
                      aria-label="What this works"
                      style={{ background: "none", border: "none", color: C.text, padding: 0, cursor: "pointer", display: "flex" }}
                    >
                      <Info size={20} strokeWidth={2} />
                    </button>
                    <IconButton icon={Video} onClick={() => openSheet("video", ex, exUid)} label="Video" />
                    {!exDone && doneCount === 0 && (
                      <Chip icon={RefreshCw} onClick={() => swapExercise(exIndex)}>Swap</Chip>
                    )}
                    <Chip icon={MessageCircle} onClick={() => openSheet("tip", ex, exUid)} tone="accent">Coach tip</Chip>
                  </div>
                </div>
              );
            })}

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Activity size={22} color={C.accentSoft} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>Treadmill Cardio</div>
                  <div style={{ fontSize: 14, color: C.textDim, marginTop: 2 }}>{workout.cardio.duration}</div>
                </div>
              </div>
              {workout.cardio.details.map((row, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  fontSize: 14,
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                  color: i === workout.cardio.details.length - 1 ? C.textDim : C.text
                }}>
                  <span style={{ color: C.accentSoft, fontWeight: 600 }}>{row.time}</span>
                  <span>{row.speed}</span>
                  <span style={{ color: C.accentSoft }}>{row.incline}</span>
                </div>
              ))}
            </div>

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Wind size={20} color={C.accentSoft} />
                <span style={{ fontWeight: 700, fontSize: 17 }}>Cooldown — {workout.cooldown.duration}</span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.accentSoft,
                  background: C.accentBg,
                  padding: "4px 10px",
                  borderRadius: RADIUS.pill
                }}>
                  Recommended
                </span>
              </div>
              {workout.cooldown.stretches.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 15, color: C.text }}>
                  <span style={{ color: C.accentSoft, fontSize: 8 }}>●</span> {item}
                </div>
              ))}
            </div>

            {postWorkoutMeal && (
              <MealCard meal={postWorkoutMeal} icon={MEAL_ICONS["Post Workout"] ?? GlassWater} collapsible />
            )}

            {progressPct < 100 && (
              <button
                onClick={finishWorkout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: C.success,
                  border: "none",
                  borderRadius: RADIUS.control,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "18px 20px",
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 16,
                  boxSizing: "border-box"
                }}
              >
                <CheckCircle2 size={19} />
                Finish Workout
              </button>
            )}

            {progressPct === 100 && (
              <div style={{
                background: C.successBg,
                border: `1px solid ${C.borderDone}`,
                borderRadius: RADIUS.card,
                padding: 28,
                textAlign: "center",
                marginBottom: 16
              }}>
                <PartyPopper size={36} color={C.successBright} style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 800, fontSize: 20, color: C.successBright }}>{workout.label} Complete!</div>
                <div style={{ fontSize: 14, color: C.textDim, marginTop: 6 }}>Come back and tackle your next day.</div>
                {preFinishSnapshot && preFinishSnapshot.workoutId === workout.id && (
                  <button
                    onClick={undoFinishWorkout}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 14,
                      background: "none",
                      border: `1px solid ${C.borderDone}`,
                      borderRadius: RADIUS.pill,
                      color: C.successBright,
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "9px 16px",
                      cursor: "pointer"
                    }}
                  >
                    <RotateCcw size={14} />
                    Marked done by mistake? Undo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "nutrition" && (
          <div>
            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                <Target size={18} color={C.accentSoft} />
                <div style={{ fontWeight: 700, fontSize: 17 }}>
                  Your Targets — {goalLabels[profile.goal] ?? "General Fitness"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 16, lineHeight: 1.6 }}>
                {plan.nutritionTargets.tip}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Calories", value: plan.nutritionTargets.calories, unit: "kcal" },
                  { label: "Protein", value: plan.nutritionTargets.proteinG, unit: "g" },
                  { label: "Carbs", value: plan.nutritionTargets.carbsG, unit: "g" },
                  { label: "Fat", value: plan.nutritionTargets.fatG, unit: "g" }
                ].map((m, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", background: C.inset, borderRadius: RADIUS.chip, padding: "14px 4px" }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: C.accentSoft }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{m.label} ({m.unit})</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <Utensils size={18} color={C.accentSoft} />
                <div style={{ fontWeight: 700, fontSize: 17 }}>Today's Food Log</div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.textDim, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{Math.round(foodTotals.calories)} / {plan.nutritionTargets.calories} kcal</span>
                  <span style={{ fontWeight: 700, color: foodTotals.calories > plan.nutritionTargets.calories ? C.danger : C.successBright }}>
                    {foodTotals.calories === 0 ? "Not logged yet" : foodTotals.calories > plan.nutritionTargets.calories ? "Over target" : "On track"}
                  </span>
                </div>
                <div style={{ background: C.inset, borderRadius: RADIUS.pill, height: 10 }}>
                  <div style={{
                    background: foodTotals.calories > plan.nutritionTargets.calories ? C.danger : C.accent,
                    width: `${Math.min(100, (foodTotals.calories / plan.nutritionTargets.calories) * 100)}%`,
                    height: "100%",
                    borderRadius: RADIUS.pill,
                    transition: "width 0.4s ease"
                  }} />
                </div>
                <div style={{ fontSize: 13, color: C.textDim, marginTop: 8 }}>
                  Protein: {Math.round(foodTotals.protein)}g / {plan.nutritionTargets.proteinG}g
                </div>
              </div>

              <div style={{ position: "relative", marginBottom: foodQuery ? 10 : 0 }}>
                <Search size={16} color={C.textFaint} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder="Search food e.g. chapati, rice, egg..."
                  style={{
                    width: "100%",
                    background: C.inset,
                    border: `1px solid ${C.border}`,
                    borderRadius: RADIUS.chip,
                    color: C.text,
                    padding: "14px 14px 14px 40px",
                    fontSize: 15,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {foodQuery.trim().length > 0 && !customFoodMode && (
                <div style={{ marginBottom: 10 }}>
                  {foodMatches.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => addFoodEntry(f)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        background: C.inset,
                        border: `1px solid ${C.border}`,
                        borderRadius: RADIUS.chip,
                        padding: "12px 14px",
                        marginBottom: 8,
                        cursor: "pointer",
                        color: C.text,
                        fontSize: 14,
                        textAlign: "left",
                        boxSizing: "border-box"
                      }}
                    >
                      <span>{f.name} <span style={{ color: C.textFaint }}>· {f.unit}</span></span>
                      <span style={{ color: C.accentSoft, fontWeight: 700, whiteSpace: "nowrap" }}>{f.calories} kcal</span>
                    </button>
                  ))}
                  {foodMatches.length === 0 && (
                    <div style={{ fontSize: 13, color: C.textDim, marginBottom: 10 }}>No match found.</div>
                  )}
                  <button
                    onClick={() => { setCustomFoodMode(true); setCustomFoodForm({ name: foodQuery, calories: "", protein: "", carbs: "", fat: "" }); }}
                    style={{ background: "none", border: "none", color: C.accentSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    + Add "{foodQuery}" as custom entry
                  </button>
                </div>
              )}

              {customFoodMode && (
                <div style={{ background: C.inset, border: `1px solid ${C.border}`, borderRadius: RADIUS.chip, padding: 14, marginBottom: 12 }}>
                  <input
                    value={customFoodForm.name}
                    onChange={(e) => setCustomFoodForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Food name"
                    style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: 11, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }}
                  />

                  <div style={{ fontSize: 13, color: C.textDim, marginBottom: 8 }}>
                    Don't know the calories? Pick the closest match to estimate:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
                    {genericFoodCategories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => applyCategoryEstimate(cat)}
                        style={{
                          background: C.card,
                          border: `1px solid ${C.border}`,
                          borderRadius: RADIUS.pill,
                          color: C.accentSoft,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 12px",
                          cursor: "pointer"
                        }}
                      >
                        {cat.label} · {cat.calories} kcal
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    value={customFoodForm.calories}
                    onChange={(e) => setCustomFoodForm((f) => ({ ...f, calories: e.target.value }))}
                    placeholder="Calories"
                    style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: 11, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {[
                      { key: "protein", placeholder: "Protein (g)" },
                      { key: "carbs", placeholder: "Carbs (g)" },
                      { key: "fat", placeholder: "Fat (g)" }
                    ].map((field) => (
                      <input
                        key={field.key}
                        type="number"
                        value={customFoodForm[field.key]}
                        onChange={(e) => setCustomFoodForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: 11, fontSize: 13, boxSizing: "border-box" }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={submitCustomFood}
                      style={{ flex: 1, background: C.accent, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, padding: "11px 0", cursor: "pointer" }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setCustomFoodMode(false)}
                      style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: 10, color: C.textDim, fontWeight: 700, fontSize: 14, padding: "11px 0", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {todayFoodEntries.length > 0 && (
                <div>
                  {todayFoodEntries.map((e) => {
                    const qty = e.qty || 1;
                    return (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.border}`, fontSize: 14, gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: C.text }}>{e.name}</div>
                        {e.unit && <div style={{ color: C.textFaint, fontSize: 12, marginTop: 2 }}>{e.unit} each</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => updateFoodQty(e.id, -1)}
                          style={{ width: 28, height: 28, background: C.inset, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: 18, textAlign: "center", color: C.text, fontWeight: 700 }}>{qty}</span>
                        <button
                          onClick={() => updateFoodQty(e.id, 1)}
                          style={{ width: 28, height: 28, background: C.inset, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: C.accentSoft, fontWeight: 600, whiteSpace: "nowrap" }}>{Math.round(e.calories * qty)} kcal</span>
                        <button
                          onClick={() => removeFoodEntry(e.id)}
                          style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 0, display: "flex" }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {plan.nutrition
              .filter((meal) => meal.time !== "Pre Workout" && meal.time !== "Post Workout")
              .map((meal, i) => (
                <MealCard
                  key={i}
                  meal={meal}
                  icon={MEAL_ICONS[meal.time] ?? Utensils}
                  extraNote={goalMealHints[profile.goal]?.[meal.time]}
                />
              ))}

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <BarChart3 size={18} color={C.accentSoft} />
                <div style={{ fontWeight: 700, fontSize: 16 }}>Daily Targets</div>
              </div>
              {[
                { label: "Water", value: "3 litres", icon: Droplets },
                { label: "Treats", value: "Max 2x/week", icon: Cookie },
                { label: "Finish dinner by", value: "8:30 PM", icon: MoonStar },
                { label: "Protein every meal", value: "Non-negotiable", icon: Dumbbell },
                { label: "Steps", value: "7,000–8,000/day", icon: Footprints }
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  fontSize: 14,
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9, color: C.text }}>
                    <item.icon size={16} color={C.textDim} />
                    {item.label}
                  </span>
                  <span style={{ color: C.accentSoft, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            <div style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <CalendarDays size={18} color={C.accentSoft} />
                  <div style={{ fontWeight: 700, fontSize: 17 }}>Your Week</div>
                </div>
                {!editingSchedule && (
                  <Chip icon={Pencil} onClick={startEditingSchedule} tone="accent">Edit Days</Chip>
                )}
              </div>

              {editingSchedule ? (
                <div>
                  <div style={{ fontSize: 13, color: C.textDim, marginBottom: 12 }}>
                    Select {profile.daysPerWeek} training days ({draftDays.length}/{profile.daysPerWeek} selected)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7, marginBottom: 16 }}>
                    {WEEKDAY_NAMES.map((wd, i) => {
                      const selected = draftDays.includes(i);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDraftDay(i)}
                          style={{
                            textAlign: "center",
                            padding: "14px 4px",
                            borderRadius: RADIUS.chip,
                            background: selected ? C.accent : C.inset,
                            border: selected ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                            color: selected ? "#fff" : C.textDim,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          {wd}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={saveSchedule}
                      disabled={draftDays.length !== profile.daysPerWeek}
                      style={{
                        flex: 1,
                        background: draftDays.length === profile.daysPerWeek ? C.accent : C.inset,
                        border: "none",
                        borderRadius: RADIUS.chip,
                        color: draftDays.length === profile.daysPerWeek ? "#fff" : C.textFaint,
                        fontWeight: 700,
                        fontSize: 15,
                        padding: "13px 0",
                        cursor: draftDays.length === profile.daysPerWeek ? "pointer" : "default"
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSchedule(false)}
                      style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: RADIUS.chip, color: C.textDim, fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7 }}>
                  {plan.weekSchedule.map((d, i) => {
                    const DayIcon = d.active ? Dumbbell : (d.icon === "😴" ? MoonStar : Footprints);
                    return (
                    <button
                      key={i}
                      onClick={() => d.trainingDayId && setSelectedDayId(d.trainingDayId)}
                      style={{
                        textAlign: "center",
                        padding: "12px 4px",
                        borderRadius: RADIUS.chip,
                        background: d.active ? C.accentBg : C.inset,
                        border: d.active ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                        cursor: d.trainingDayId ? "pointer" : "default"
                      }}
                    >
                      <DayIcon size={16} color={d.active ? C.accentSoft : C.textFaint} style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: d.active ? C.accentSoft : C.textDim }}>{d.day} {d.dateNum}</div>
                      <div style={{ fontSize: 11, color: d.active ? C.accentSoft : C.textFaint, marginTop: 3 }}>{d.label}</div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <ProgressTab history={history} />
        )}
      </div>

      {restTimer && (
        <div style={{
          position: "fixed",
          bottom: TAB_BAR_HEIGHT,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 420,
          background: C.card,
          borderTop: `1px solid ${C.accent}`,
          padding: "16px 20px",
          boxSizing: "border-box",
          zIndex: 25,
          boxShadow: `0 -8px 24px ${C.shadow}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.accentSoft, fontWeight: 700 }}>
              <Timer size={15} />
              Resting — {restTimer.exName}
            </div>
            <button
              onClick={() => setRestTimer(null)}
              style={{ background: "none", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", fontWeight: 700 }}
            >
              Skip
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, minWidth: 72 }}>
              {restTimer.secondsLeft > 0
                ? `${Math.floor(restTimer.secondsLeft / 60)}:${String(restTimer.secondsLeft % 60).padStart(2, "0")}`
                : "Go!"}
            </div>
            <div style={{ flex: 1, background: C.inset, borderRadius: RADIUS.pill, height: 10 }}>
              <div style={{
                background: C.accent,
                width: `${(restTimer.secondsLeft / restTimer.total) * 100}%`,
                height: "100%",
                borderRadius: RADIUS.pill,
                transition: "width 1s linear"
              }} />
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 420,
        display: "flex",
        background: C.tabBarBg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`,
        boxShadow: `0 -6px 24px ${C.shadow}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 30
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px 4px 10px",
              border: "none",
              background: "none",
              color: activeTab === tab.id ? C.accentSoft : C.textFaint,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "color 0.2s"
            }}
          >
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.4 : 2} />
            <div style={{ fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 500 }}>{tab.label}</div>
          </button>
        ))}
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pickAvatarFile(file);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
      {showProfile && (
        <ProfilePanel
          profile={profile}
          onClose={() => setShowProfile(false)}
          onUpdate={updateProfile}
          onPickAvatar={() => avatarInputRef.current?.click()}
          onRetake={retakeQuestionnaire}
        />
      )}

      {sheet && sheet.type === "info" && (
        <BottomSheet title={`What ${sheet.ex.name} works`} onClose={closeSheet}>
          {sheet.ex.muscles && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
              <Target size={16} color={C.accentSoft} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700 }}>Targets: </span>
                {sheet.ex.muscles.join(", ")}
              </div>
            </div>
          )}
          <div style={{ fontSize: 15, color: C.textDim, lineHeight: 1.6 }}>
            {categoryPurpose[sheet.ex.category]}
          </div>
        </BottomSheet>
      )}

      {sheet && sheet.type === "tip" && (
        <BottomSheet title="Coach tip" onClose={closeSheet}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <MessageCircle size={16} color={C.accentSoft} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>{sheet.ex.tip}</div>
          </div>
        </BottomSheet>
      )}

      {sheet && sheet.type === "weight" && (
        <WeightEditSheet
          sheet={sheet}
          hasOverride={Boolean(weightMemory[sheet.ex.id]?.[sheet.setIndex] != null)}
          onSave={(text) => saveWeightOverride(sheet.ex.id, sheet.setIndex, text)}
          onReset={() => resetWeightOverride(sheet.ex.id, sheet.setIndex)}
          onClose={closeSheet}
        />
      )}

      {sheet && sheet.type === "video" && (
        <BottomSheet title={`${sheet.ex.name} — Form Video`} onClose={closeSheet}>
          <div style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56.25%",
            borderRadius: RADIUS.chip,
            overflow: "hidden",
            background: "#000"
          }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${sheet.ex.videoId}`}
              title={`${sheet.ex.name} form video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${sheet.ex.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: C.accentSoft, textDecoration: "none" }}
          >
            Open in YouTube ↗
          </a>
        </BottomSheet>
      )}
    </div>
  );
}

const PROFILE_DRAFT_KEYS = ["name", "bodyWeight", "age", "sex", "goal", "level", "daysPerWeek", "equipment", "diet"];

function ProfilePanel({ profile, onClose, onUpdate, onPickAvatar, onRetake }) {
  const [draft, setDraft] = useState(() => {
    const d = {};
    for (const key of PROFILE_DRAFT_KEYS) d[key] = key === "name" ? profile.name || "" : profile[key];
    return d;
  });
  const [nameDraft, setNameDraft] = useState(profile.name || "");
  const [weightDraft, setWeightDraft] = useState(profile.bodyWeight != null ? String(profile.bodyWeight) : "");
  const [ageDraft, setAgeDraft] = useState(profile.age != null ? String(profile.age) : "");

  const dirty = PROFILE_DRAFT_KEYS.some((key) => draft[key] !== (key === "name" ? profile.name || "" : profile[key]));

  const patchDraft = (fields) => setDraft((d) => ({ ...d, ...fields }));

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed !== draft.name) patchDraft({ name: trimmed });
  };
  const commitWeight = () => {
    const num = parseFloat(weightDraft);
    if (!Number.isNaN(num) && num > 0 && num !== draft.bodyWeight) patchDraft({ bodyWeight: num });
  };
  const commitAge = () => {
    const num = parseInt(ageDraft, 10);
    if (!Number.isNaN(num) && num > 0 && num !== draft.age) patchDraft({ age: num });
  };

  const handleSave = () => {
    onUpdate(draft);
  };

  const handleRetake = () => {
    if (window.confirm("This resets your whole plan, progress, and schedule. Are you sure?")) {
      onRetake();
    }
  };

  const fieldRow = (label, key, hint) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, color: C.textDim, marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PROFILE_FIELD_OPTIONS[key].map((opt) => {
          const selected = draft[key] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => patchDraft({ [key]: opt.value })}
              style={{
                background: selected ? C.accent : C.inset,
                border: selected ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                color: selected ? "#fff" : C.textDim,
                borderRadius: RADIUS.chip,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint && <div style={{ fontSize: 12, color: C.textFaint, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: C.bg,
      zIndex: 50,
      overflowY: "auto",
      maxWidth: 420,
      margin: "0 auto"
    }}>
      <div style={{
        background: C.headerGrad,
        borderBottom: `1px solid ${C.border}`,
        padding: "24px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Your Profile</div>
        <button
          onClick={onClose}
          style={{ background: C.inset, border: "none", color: C.text, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <button
            onClick={onPickAvatar}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative" }}
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `1px solid ${C.border}` }}
              />
            ) : (
              <div style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: C.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 800,
                color: "#fff"
              }}>
                {getInitials(profile.name) || <Dumbbell size={32} color="#fff" />}
              </div>
            )}
            <div style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: C.card,
              border: `2px solid ${C.bg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Camera size={14} color={C.text} />
            </div>
          </button>
          <div style={{ fontSize: 13, color: C.textFaint, marginTop: 10 }}>Tap to change photo</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 8, fontWeight: 600 }}>Name</div>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            placeholder="e.g. Alex"
            style={{ width: "100%", background: C.inset, border: `1px solid ${C.border}`, borderRadius: RADIUS.chip, color: C.text, padding: 13, fontSize: 15, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.textDim, marginBottom: 8, fontWeight: 600 }}>Body weight (kg)</div>
            <input
              type="number"
              value={weightDraft}
              onChange={(e) => setWeightDraft(e.target.value)}
              onBlur={commitWeight}
              style={{ width: "100%", background: C.inset, border: `1px solid ${C.border}`, borderRadius: RADIUS.chip, color: C.text, padding: 13, fontSize: 15, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.textDim, marginBottom: 8, fontWeight: 600 }}>Age</div>
            <input
              type="number"
              value={ageDraft}
              onChange={(e) => setAgeDraft(e.target.value)}
              onBlur={commitAge}
              style={{ width: "100%", background: C.inset, border: `1px solid ${C.border}`, borderRadius: RADIUS.chip, color: C.text, padding: 13, fontSize: 15, boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.textFaint, marginTop: -10, marginBottom: 20, lineHeight: 1.5 }}>
          Update these whenever they change — worth a quick check every few weeks, since your suggested weights and calorie targets are based on them.
        </div>

        {fieldRow("Sex", "sex")}
        {fieldRow("Main goal", "goal")}
        {fieldRow("Experience level", "level")}
        {fieldRow("Days per week", "daysPerWeek", draft.daysPerWeek && "Changing this regenerates your split — a custom Schedule (Edit Days) may reset to the default.")}
        {fieldRow("Equipment", "equipment")}
        {fieldRow("Diet", "diet")}

        {dirty && (
          <button
            onClick={handleSave}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              background: C.accent,
              border: "none",
              borderRadius: RADIUS.chip,
              color: "#fff",
              padding: "15px 0",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 20
            }}
          >
            <CheckCircle2 size={17} /> Save Changes
          </button>
        )}

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 20 }}>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 12, fontWeight: 600 }}>Data & Account</div>
          <button
            onClick={handleRetake}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.dangerBg, border: "none", borderRadius: RADIUS.chip, color: C.danger, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            <RotateCcw size={15} /> Retake full questionnaire
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressTab({ history }) {
  const sorted = useMemo(
    () => [...history].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [history]
  );

  const totalWorkouts = sorted.length;
  const totalSetsLogged = sorted.reduce(
    (acc, h) => acc + h.exercises.reduce((a, ex) => a + ex.setsCompleted, 0),
    0
  );
  const workoutsLast7Days = sorted.filter(
    (h) => Date.now() - new Date(h.completedAt).getTime() <= 7 * 24 * 60 * 60 * 1000
  ).length;

  // Personal bests: heaviest top-set weight ever logged per exercise name.
  const personalBests = useMemo(() => {
    const best = {};
    for (const entry of sorted) {
      for (const ex of entry.exercises) {
        if (!ex.weightsUsed || ex.weightsUsed.length === 0) continue;
        const topWeight = ex.weightsUsed[ex.weightsUsed.length - 1];
        const value = parseFloat(topWeight);
        if (Number.isNaN(value)) continue;
        if (!best[ex.name] || value > best[ex.name].value) {
          best[ex.name] = { value, label: topWeight, date: entry.completedAt };
        }
      }
    }
    return Object.entries(best)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [sorted]);

  if (totalWorkouts === 0) {
    return (
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: RADIUS.card,
        padding: 32,
        textAlign: "center",
        color: C.textDim,
        fontSize: 15,
        lineHeight: 1.6
      }}>
        <TrendingUp size={30} color={C.textFaint} style={{ marginBottom: 10 }} />
        <div>No workouts logged yet.<br />Finish a workout and it'll show up here.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Workouts logged", value: totalWorkouts },
          { label: "Workouts (7 days)", value: workoutsLast7Days },
          { label: "Sets all-time", value: totalSetsLogged }
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.card,
            padding: "18px 8px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accentSoft }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, lineHeight: 1.3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {personalBests.length > 0 && (
        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <Trophy size={18} color={C.accentSoft} />
            <div style={{ fontWeight: 700, fontSize: 17 }}>Personal Bests</div>
          </div>
          {personalBests.map((pb, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              fontSize: 15,
              borderTop: i > 0 ? `1px solid ${C.border}` : "none"
            }}>
              <span style={{ color: C.text }}>{pb.name}</span>
              <span style={{ color: C.successBright, fontWeight: 700 }}>{pb.label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <History size={18} color={C.accentSoft} />
          <div style={{ fontWeight: 700, fontSize: 17 }}>Recent Workouts</div>
        </div>
        {sorted.slice(0, 20).map((entry, i) => {
          const setsDone = entry.exercises.reduce((a, ex) => a + ex.setsCompleted, 0);
          const setsTotal = entry.exercises.reduce((a, ex) => a + ex.totalSets, 0);
          return (
            <div key={entry.key} style={{
              padding: "12px 0",
              borderTop: i > 0 ? `1px solid ${C.border}` : "none"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                <span style={{ fontWeight: 700 }}>{entry.dayLabel}</span>
                <span style={{ color: C.textDim }}>
                  {new Date(entry.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
              <div style={{ fontSize: 13, color: C.textDim, marginTop: 4 }}>
                {setsDone}/{setsTotal} sets · {entry.exercises.map((ex) => ex.name).join(", ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
