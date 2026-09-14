import { useEffect, useMemo, useRef, useState } from "react";
import Questionnaire from "./components/Questionnaire.jsx";
import { generateWeekPlan, computeWeightsBySet, getSwapPool } from "./lib/planGenerator.js";
import { availableEquipment, categoryPurpose } from "./data/exercises.js";
import { foodDatabase, genericFoodCategories } from "./data/foods.js";

const PROFILE_KEY = "fitness-app:profile";
const PROGRESS_KEY = "fitness-app:progress";
const HISTORY_KEY = "fitness-app:history";
const SWAPS_KEY = "fitness-app:swaps";
const CUSTOM_DAYS_KEY = "fitness-app:customDays";
const FOOD_LOG_KEY = "fitness-app:foodLog";
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Shared design tokens — one dark, purple-accented system used everywhere
// so cards, type, and spacing stay consistent instead of each screen
// inventing its own numbers.
const C = {
  bg: "#0a0a0f",
  card: "#15151f",
  cardDone: "#0e1f16",
  inset: "#0d0d16",
  border: "rgba(255,255,255,0.07)",
  borderDone: "rgba(74,222,128,0.28)",
  text: "#f5f5f7",
  textDim: "#9898ac",
  textFaint: "#6b6b80",
  accent: "#7c6cff",
  accentSoft: "#b3a4ff",
  success: "#34d399",
  successBright: "#4ade80",
  danger: "#f87171",
  warn: "#fbbf24"
};
const RADIUS = { card: 20, control: 14, pill: 999, chip: 12 };
const CARD = { background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, padding: 20, marginBottom: 16 };
const TAB_BAR_HEIGHT = 78;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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

export default function FitnessApp() {
  const [profile, setProfile] = useState(() => loadJSON(PROFILE_KEY, null));
  const [progress, setProgress] = useState(() => loadJSON(PROGRESS_KEY, {}));
  const [history, setHistory] = useState(() => loadJSON(HISTORY_KEY, []));
  const [swaps, setSwaps] = useState(() => loadJSON(SWAPS_KEY, {}));
  const [customDays, setCustomDays] = useState(() => loadJSON(CUSTOM_DAYS_KEY, null));
  const [foodLog, setFoodLog] = useState(() => loadJSON(FOOD_LOG_KEY, {}));
  const [activeTab, setActiveTab] = useState("workout");
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [showTip, setShowTip] = useState({});
  const [showVideo, setShowVideo] = useState({});
  const [showInfo, setShowInfo] = useState({});
  const [savedNote, setSavedNote] = useState(false);
  const [restTimer, setRestTimer] = useState(null); // { exUid, exName, total, secondsLeft }
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [draftDays, setDraftDays] = useState([]);
  const [foodQuery, setFoodQuery] = useState("");
  const [customFoodMode, setCustomFoodMode] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const importInputRef = useRef(null);

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
  // generated plan, recomputing personalized weights for the swapped-in move.
  const displayedWorkout = useMemo(() => {
    if (!workout || !profile) return workout;
    const daySwaps = swaps[workout.id] || {};
    if (Object.keys(daySwaps).length === 0) return workout;
    const available = availableEquipment(profile.equipment);
    return {
      ...workout,
      exercises: workout.exercises.map((ex, i) => {
        const rotation = daySwaps[i] || 0;
        if (rotation === 0) return ex;
        const pool = getSwapPool(ex.category, available);
        if (pool.length <= 1) return ex;
        const baseIdx = pool.findIndex((p) => p.id === ex.id);
        const alt = pool[(baseIdx + rotation) % pool.length];
        if (!alt || alt.id === ex.id) return ex;
        const weightsBySet = computeWeightsBySet(alt, ex.category, profile.level, ex.sets, profile);
        return { ...alt, sets: ex.sets, rest: ex.rest, category: ex.category, weightsBySet };
      })
    };
  }, [workout, swaps, profile]);

  const totalSets = useMemo(
    () => (displayedWorkout ? displayedWorkout.exercises.reduce((acc, ex) => acc + ex.sets, 0) : 0),
    [displayedWorkout]
  );
  const doneSets = useMemo(
    () => Object.values(dayProgress.completedSets).filter(Boolean).length,
    [dayProgress]
  );
  const progressPct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

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
        }}
      />
    );
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

  const exportBackup = () => {
    const payload = { exportedAt: new Date().toISOString(), profile, progress, history, swaps, customDays, foodLog };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitness-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.profile) {
          saveJSON(PROFILE_KEY, data.profile);
          setProfile(data.profile);
        }
        if (data.progress) {
          saveJSON(PROGRESS_KEY, data.progress);
          setProgress(data.progress);
        }
        if (data.history) {
          saveJSON(HISTORY_KEY, data.history);
          setHistory(data.history);
        }
        if (data.swaps) {
          saveJSON(SWAPS_KEY, data.swaps);
          setSwaps(data.swaps);
        }
        if (data.customDays) {
          saveJSON(CUSTOM_DAYS_KEY, data.customDays);
          setCustomDays(data.customDays);
        }
        if (data.foodLog) {
          saveJSON(FOOD_LOG_KEY, data.foodLog);
          setFoodLog(data.foodLog);
        }
      } catch {
        window.alert("That file doesn't look like a valid backup.");
      }
    };
    reader.readAsText(file);
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
    setSavedNote(false);
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

  const toggleTip = (id) => {
    setShowTip((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleVideo = (id) => {
    setShowVideo((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleInfo = (id) => {
    setShowInfo((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { id: "workout", label: "Workout", icon: "🏋️" },
    { id: "nutrition", label: "Nutrition", icon: "🍽️" },
    { id: "schedule", label: "Schedule", icon: "📅" },
    { id: "progress", label: "Progress", icon: "📈" }
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
        background: "linear-gradient(160deg, #201c3d 0%, #171a30 55%, #0f1220 100%)",
        padding: "26px 20px 24px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ fontSize: 12, color: C.accentSoft, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700 }}>
            Your Plan
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={exportBackup}
              style={{ background: "none", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              ⬇ Export
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              style={{ background: "none", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              ⬆ Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importBackup(file);
                e.target.value = "";
              }}
              style={{ display: "none" }}
            />
            <button
              onClick={retakeQuestionnaire}
              style={{ background: "none", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              Retake
            </button>
          </div>
        </div>

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
                background: d.id === workout.id ? "rgba(124,108,255,0.18)" : "transparent",
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

        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, marginTop: 22, lineHeight: 1.15 }}>{workout.label}</div>
        <div style={{ fontSize: 15, color: C.textDim, marginTop: 4, fontWeight: 500 }}>{workout.dateLabel}</div>

        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: C.textDim, fontWeight: 500 }}>{doneSets}/{totalSets} sets done</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: progressPct === 100 ? C.successBright : C.accentSoft }}>{progressPct}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: RADIUS.pill, height: 10 }}>
            <div style={{
              background: progressPct === 100 ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, #7c6cff, #b3a4ff)",
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
            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <span style={{ fontWeight: 700, fontSize: 17 }}>Warm Up — 5 min</span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.warn,
                  background: "rgba(251,191,36,0.12)",
                  padding: "4px 10px",
                  borderRadius: RADIUS.pill
                }}>
                  Required
                </span>
              </div>
              {["3 min easy treadmill walk (flat)", "10 arm circles each direction", "10 bodyweight squats"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 15, color: "#d4d4e0" }}>
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
                    <span style={{ fontSize: 28 }}>{ex.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.accentSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                        Exercise {exIndex + 1} of {displayedWorkout.exercises.length}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 8, lineHeight: 1.3 }}>
                        {ex.name}
                        {exDone && <span style={{ fontSize: 15, color: C.successBright }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 14, color: C.textDim, marginTop: 4 }}>
                        {ex.sets} sets · {ex.reps} · {ex.rest}
                      </div>
                      {ex.weightsBySet && (
                        <div style={{
                          fontSize: 13,
                          color: C.accentSoft,
                          marginTop: 8,
                          fontWeight: 600,
                          background: "rgba(124,108,255,0.1)",
                          padding: "7px 10px",
                          borderRadius: RADIUS.chip,
                          lineHeight: 1.5
                        }}>
                          🏋️ {ex.weightsBySet.join(" → ")}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                      <button
                        onClick={() => toggleVideo(exUid)}
                        style={{
                          background: "rgba(255,68,68,0.12)",
                          border: "1px solid rgba(255,68,68,0.25)",
                          color: "#ff6b6b",
                          borderRadius: RADIUS.chip,
                          padding: "7px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        {showVideo[exUid] ? "▲ Hide" : "▶ Video"}
                      </button>
                      {!exDone && doneCount === 0 && (
                        <button
                          onClick={() => swapExercise(exIndex)}
                          style={{
                            background: "none",
                            border: `1px solid ${C.border}`,
                            color: C.textDim,
                            borderRadius: RADIUS.chip,
                            padding: "7px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🔄 Swap
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{
                    background: C.inset,
                    borderRadius: RADIUS.chip,
                    padding: "12px 14px",
                    fontSize: 14,
                    color: "#a8a8bd",
                    marginBottom: 14,
                    lineHeight: 1.55
                  }}>
                    💡 {ex.cue}
                  </div>

                  {showVideo[exUid] && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "56.25%",
                        borderRadius: RADIUS.chip,
                        overflow: "hidden",
                        background: "#000"
                      }}>
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ex.videoId}`}
                          title={`${ex.name} form video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                        />
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${ex.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-block", marginTop: 8, fontSize: 13, color: C.accentSoft, textDecoration: "none" }}
                      >
                        Open in YouTube ↗
                      </a>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const key = `${exUid}-${i + 1}`;
                      const done = dayProgress.completedSets[key];
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSet(exUid, i + 1, ex.name, ex.rest, i === ex.sets - 1)}
                          style={{
                            flex: 1,
                            padding: "15px 0",
                            borderRadius: RADIUS.control,
                            border: done ? "none" : `1px solid ${C.border}`,
                            background: done ? "linear-gradient(135deg, #7c6cff, #b3a4ff)" : C.inset,
                            color: done ? "#fff" : C.textDim,
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <div>{done ? "✓" : `Set ${i + 1}`}</div>
                          {ex.weightsBySet && (
                            <div style={{
                              fontSize: 11,
                              fontWeight: 600,
                              marginTop: 3,
                              opacity: done ? 0.9 : 0.7
                            }}>
                              {ex.weightsBySet[i]}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggleTip(exUid)}
                      style={{
                        background: "rgba(124,108,255,0.1)",
                        border: "none",
                        color: C.accentSoft,
                        fontSize: 13,
                        cursor: "pointer",
                        padding: "7px 12px",
                        borderRadius: RADIUS.chip,
                        fontWeight: 600
                      }}
                    >
                      {showTip[exUid] ? "▲ Coach tip" : "▼ Coach tip"}
                    </button>
                    <button
                      onClick={() => toggleInfo(exUid)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "none",
                        color: C.textDim,
                        fontSize: 13,
                        cursor: "pointer",
                        padding: "7px 12px",
                        borderRadius: RADIUS.chip,
                        fontWeight: 600
                      }}
                    >
                      {showInfo[exUid] ? "▲ ⓘ What's this for" : "ⓘ What's this for"}
                    </button>
                    {!exDone && (
                      <button
                        onClick={() => completeAllSets(exUid, ex.sets)}
                        style={{
                          background: "rgba(74,222,128,0.1)",
                          border: "none",
                          color: C.successBright,
                          fontSize: 13,
                          cursor: "pointer",
                          padding: "7px 12px",
                          borderRadius: RADIUS.chip,
                          fontWeight: 600
                        }}
                      >
                        ✓ Mark all done
                      </button>
                    )}
                  </div>
                  {showTip[exUid] && (
                    <div style={{
                      marginTop: 10,
                      padding: "12px 14px",
                      background: "rgba(124,108,255,0.08)",
                      borderRadius: RADIUS.chip,
                      fontSize: 14,
                      color: "#cdbfff",
                      lineHeight: 1.55
                    }}>
                      🎯 {ex.tip}
                    </div>
                  )}
                  {showInfo[exUid] && (
                    <div style={{
                      marginTop: 10,
                      padding: "14px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: RADIUS.chip,
                      fontSize: 14,
                      color: "#c8c8da",
                      lineHeight: 1.6
                    }}>
                      {ex.muscles && (
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ color: C.text, fontWeight: 700 }}>🎯 Targets: </span>
                          {ex.muscles.join(", ")}
                        </div>
                      )}
                      <div>{categoryPurpose[ex.category]}</div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>🏃</span>
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

            {progressPct < 100 && (
              <button
                onClick={finishWorkout}
                style={{
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  border: "none",
                  borderRadius: RADIUS.control,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "18px 20px",
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 16,
                  boxShadow: "0 8px 24px rgba(34,197,94,0.25)"
                }}
              >
                ✅ Finish Workout
              </button>
            )}

            <div style={CARD}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📝 Post-Workout Notes</div>
              <textarea
                placeholder="How did it feel? Any exercise that was hard? Weights used?"
                value={dayProgress.notes}
                onChange={(e) => setDayProgress((current) => ({ ...current, notes: e.target.value }))}
                style={{
                  width: "100%",
                  background: C.inset,
                  border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.chip,
                  color: C.text,
                  padding: 14,
                  fontSize: 15,
                  minHeight: 90,
                  resize: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
              <button
                onClick={() => setSavedNote(true)}
                style={{
                  marginTop: 10,
                  background: "linear-gradient(135deg, #7c6cff, #b3a4ff)",
                  border: "none",
                  borderRadius: RADIUS.chip,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "13px 20px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                {savedNote ? "✓ Saved!" : "Save Notes"}
              </button>
            </div>

            {progressPct === 100 && (
              <div style={{
                background: "linear-gradient(135deg, #0a4a34, #0f6b4a)",
                border: "1px solid rgba(52,211,153,0.35)",
                borderRadius: RADIUS.card,
                padding: 28,
                textAlign: "center",
                marginBottom: 16
              }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: C.successBright }}>{workout.label} Complete!</div>
                <div style={{ fontSize: 14, color: "#8fe0bd", marginTop: 6 }}>Come back and tackle your next day.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "nutrition" && (
          <div>
            <div style={CARD}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                🎯 Your Targets — {goalLabels[profile.goal] ?? "General Fitness"}
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
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>🍽️ Today's Food Log</div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.textDim, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{Math.round(foodTotals.calories)} / {plan.nutritionTargets.calories} kcal</span>
                  <span style={{ fontWeight: 700, color: foodTotals.calories > plan.nutritionTargets.calories ? C.danger : C.successBright }}>
                    {foodTotals.calories === 0 ? "Not logged yet" : foodTotals.calories > plan.nutritionTargets.calories ? "Over target" : "On track"}
                  </span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: RADIUS.pill, height: 10 }}>
                  <div style={{
                    background: foodTotals.calories > plan.nutritionTargets.calories
                      ? "linear-gradient(90deg, #f87171, #ef4444)"
                      : "linear-gradient(90deg, #7c6cff, #b3a4ff)",
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
                  padding: 14,
                  fontSize: 15,
                  boxSizing: "border-box",
                  marginBottom: foodQuery ? 10 : 0
                }}
              />

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
                      style={{ flex: 1, background: "linear-gradient(135deg, #7c6cff, #b3a4ff)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, padding: "11px 0", cursor: "pointer" }}
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
                        <div style={{ color: "#d4d4e0" }}>{e.name}</div>
                        {e.unit && <div style={{ color: C.textFaint, fontSize: 12, marginTop: 2 }}>{e.unit} each</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => updateFoodQty(e.id, -1)}
                          style={{ width: 28, height: 28, background: C.inset, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 18, textAlign: "center", color: C.text, fontWeight: 700 }}>{qty}</span>
                        <button
                          onClick={() => updateFoodQty(e.id, 1)}
                          style={{ width: 28, height: 28, background: C.inset, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}
                        >
                          +
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: C.accentSoft, fontWeight: 600, whiteSpace: "nowrap" }}>{Math.round(e.calories * qty)} kcal</span>
                        <button
                          onClick={() => removeFoodEntry(e.id)}
                          style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontSize: 14, padding: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {plan.nutrition.map((meal, i) => (
              <div key={i} style={CARD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{meal.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{meal.time}</div>
                    <div style={{ fontSize: 13, color: C.accentSoft, marginTop: 1 }}>{meal.time_label}</div>
                  </div>
                </div>
                {meal.options.map((opt, j) => (
                  <div key={j} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 0",
                    fontSize: 15,
                    color: "#d4d4e0",
                    borderTop: j > 0 ? `1px solid ${C.border}` : "none"
                  }}>
                    <span style={{ color: C.accentSoft, marginTop: 2 }}>◆</span>
                    {opt}
                  </div>
                ))}
                <div style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: C.inset,
                  borderRadius: RADIUS.chip,
                  fontSize: 13,
                  color: C.textDim
                }}>
                  💬 {meal.note}
                </div>
              </div>
            ))}

            <div style={CARD}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>📊 Daily Targets</div>
              {[
                { label: "Water", value: "3 litres", icon: "💧" },
                { label: "Treats", value: "Max 2x/week", icon: "🍦" },
                { label: "Finish dinner by", value: "8:30 PM", icon: "🌙" },
                { label: "Protein every meal", value: "Non-negotiable", icon: "💪" },
                { label: "Steps", value: "7,000–8,000/day", icon: "🚶" }
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  fontSize: 14,
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none"
                }}>
                  <span style={{ color: "#b8b8cc" }}>{item.icon} {item.label}</span>
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
                <div style={{ fontWeight: 700, fontSize: 17 }}>📅 Your Week</div>
                {!editingSchedule && (
                  <button
                    onClick={startEditingSchedule}
                    style={{ background: "rgba(124,108,255,0.1)", border: "none", color: C.accentSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "7px 12px", borderRadius: RADIUS.chip }}
                  >
                    ✏️ Edit Days
                  </button>
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
                            background: selected ? "linear-gradient(135deg, #7c6cff, #b3a4ff)" : C.inset,
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
                        background: draftDays.length === profile.daysPerWeek ? "linear-gradient(135deg, #7c6cff, #b3a4ff)" : "rgba(255,255,255,0.06)",
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
                  {plan.weekSchedule.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => d.trainingDayId && setSelectedDayId(d.trainingDayId)}
                      style={{
                        textAlign: "center",
                        padding: "12px 4px",
                        borderRadius: RADIUS.chip,
                        background: d.active ? "rgba(124,108,255,0.16)" : C.inset,
                        border: d.active ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                        cursor: d.trainingDayId ? "pointer" : "default"
                      }}
                    >
                      <div style={{ fontSize: 17, marginBottom: 5 }}>{d.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: d.active ? C.accentSoft : C.textDim }}>{d.day} {d.dateNum}</div>
                      <div style={{ fontSize: 11, color: d.active ? "#9d8fe0" : C.textFaint, marginTop: 3 }}>{d.label}</div>
                    </button>
                  ))}
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
          background: "linear-gradient(135deg, #201c3d, #171a30)",
          borderTop: `1px solid ${C.accent}`,
          padding: "16px 20px",
          boxSizing: "border-box",
          zIndex: 25,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.4)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: C.accentSoft, fontWeight: 700 }}>😮‍💨 Resting — {restTimer.exName}</div>
            <button
              onClick={() => setRestTimer(null)}
              style={{ background: "none", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", fontWeight: 700 }}
            >
              Skip ✕
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", minWidth: 72 }}>
              {restTimer.secondsLeft > 0
                ? `${Math.floor(restTimer.secondsLeft / 60)}:${String(restTimer.secondsLeft % 60).padStart(2, "0")}`
                : "Go! 💪"}
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: RADIUS.pill, height: 10 }}>
              <div style={{
                background: "linear-gradient(90deg, #7c6cff, #b3a4ff)",
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
        background: "#1c1c29",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.45)",
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
            <div style={{ fontSize: 23 }}>{tab.icon}</div>
            <div style={{ fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 500 }}>{tab.label}</div>
          </button>
        ))}
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
        <div style={{ fontSize: 32, marginBottom: 10 }}>📈</div>
        No workouts logged yet.<br />Finish a workout and it'll show up here.
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
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>🏆 Personal Bests</div>
          {personalBests.map((pb, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              fontSize: 15,
              borderTop: i > 0 ? `1px solid ${C.border}` : "none"
            }}>
              <span style={{ color: "#d4d4e0" }}>{pb.name}</span>
              <span style={{ color: C.successBright, fontWeight: 700 }}>{pb.label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={CARD}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>📜 Recent Workouts</div>
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
