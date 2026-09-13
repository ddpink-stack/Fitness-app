import { useEffect, useState } from "react";

const workoutDays = {
  1: {
    day: "Day 1 — Monday",
    subtitle: "Wake The Body Up",
    phase: "Phase 1 · Week 1",
    exercises: [
      {
        id: 1,
        name: "Goblet Squat",
        sets: 3,
        reps: "12 reps",
        rest: "60 sec rest",
        cue: "Hold dumbbell at chest, sit back like a chair, push through heels",
        tip: "Start with 5–8kg. Light is right today.",
        youtube: "https://www.youtube.com/results?search_query=goblet+squat+beginner+form",
        emoji: "🏋️"
      },
      {
        id: 2,
        name: "Single Arm Dumbbell Row",
        sets: 3,
        reps: "12 reps each side",
        rest: "60 sec rest",
        cue: "One knee on bench, pull elbow up toward ceiling, squeeze your back",
        tip: "Don't twist your body. Keep it slow and controlled.",
        youtube: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+proper+form",
        emoji: "💪"
      },
      {
        id: 3,
        name: "Incline Push Up",
        sets: 3,
        reps: "10 reps",
        rest: "60 sec rest",
        cue: "Hands on bench, body straight as a plank, lower chest toward bench",
        tip: "Don't let your hips sag. If too easy, go lower surface.",
        youtube: "https://www.youtube.com/results?search_query=incline+push+up+form+beginner",
        emoji: "🤸"
      },
      {
        id: 4,
        name: "Cable Lat Pulldown",
        sets: 3,
        reps: "12 reps",
        rest: "60 sec rest",
        cue: "Grip wide, lean back slightly, pull bar to upper chest, squeeze shoulder blades",
        tip: "Don't let the cable yank you back up. Control the return.",
        youtube: "https://www.youtube.com/results?search_query=lat+pulldown+form+for+beginners",
        emoji: "🎯"
      },
      {
        id: 5,
        name: "Plank",
        sets: 3,
        reps: "20 seconds",
        rest: "45 sec rest",
        cue: "Elbows under shoulders, body straight, breathe normally",
        tip: "Don't hold your breath. Quality over duration.",
        youtube: "https://www.youtube.com/results?search_query=how+to+plank+correctly+beginner",
        emoji: "🧘"
      }
    ],
    cardio: {
      duration: "20 min",
      details: [
        { time: "0–5 min", speed: "4.5 kmph", incline: "Incline 3" },
        { time: "5–15 min", speed: "5.5 kmph", incline: "Incline 5" },
        { time: "15–20 min", speed: "4.0 kmph", incline: "Incline 2 (cool down)" }
      ]
    }
  }
};

const weekSchedule = [
  { day: "Mon", label: "Gym", active: true, icon: "🏋️" },
  { day: "Tue", label: "Walk", active: false, icon: "🚶" },
  { day: "Wed", label: "Gym", active: true, icon: "🏋️" },
  { day: "Thu", label: "Walk", active: false, icon: "🚶" },
  { day: "Fri", label: "Gym", active: true, icon: "🏋️" },
  { day: "Sat", label: "Rest", active: false, icon: "😴" },
  { day: "Sun", label: "Rest", active: false, icon: "😴" }
];

const meals = [
  {
    time: "Breakfast",
    icon: "🍳",
    time_label: "7–8 AM",
    options: ["3–4 eggs (any style) + 2 chapatis", "Paneer bhurji + multigrain toast", "Egg bhurji + toast"],
    note: "Coffee with milk ✅ — totally fine"
  },
  {
    time: "Lunch",
    icon: "☀️",
    time_label: "12:30–2 PM",
    options: ["Dal + sabzi + 1–2 chapatis + curd", "Rajma/chana with small bowl rice", "Paneer sabzi + dal + rice"],
    note: "Biggest meal of the day. Don't restrict here."
  },
  {
    time: "Dinner",
    icon: "🌙",
    time_label: "7:30–8:30 PM",
    options: ["Soya chunks curry + sabzi + 1 chapati", "Paneer sabzi + dal + 1 chapati", "Egg curry + sabzi"],
    note: "Lighter than lunch. Finish by 8:30pm."
  },
  {
    time: "Post Workout",
    icon: "🥤",
    time_label: "After gym",
    options: ["1 scoop whey protein with water or milk"],
    note: "MuscleBlaze Biozyme or ON Gold Standard recommended"
  }
];

const STORAGE_KEY = "fitness-app:day-1";

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function FitnessApp() {
  const saved = loadSavedProgress();

  const [activeTab, setActiveTab] = useState("workout");
  const [completedSets, setCompletedSets] = useState(saved?.completedSets ?? {});
  const [showTip, setShowTip] = useState({});
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [savedNote, setSavedNote] = useState(false);

  const workout = workoutDays[1];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedSets, notes }));
    } catch {
      // storage unavailable (private browsing, quota, etc.) — progress just won't persist
    }
  }, [completedSets, notes]);

  const toggleSet = (exerciseId, setNum) => {
    const key = `${exerciseId}-${setNum}`;
    setCompletedSets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTip = (id) => {
    setShowTip(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const doneSets = Object.values(completedSets).filter(Boolean).length;
  const progress = Math.round((doneSets / totalSets) * 100) || 0;

  const tabs = [
    { id: "workout", label: "Workout", icon: "🏋️" },
    { id: "nutrition", label: "Nutrition", icon: "🍽️" },
    { id: "schedule", label: "Schedule", icon: "📅" }
  ];

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#f0f0f5",
      maxWidth: 420,
      margin: "0 auto",
      position: "relative",
      paddingBottom: 80
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: "28px 20px 20px",
        borderBottom: "1px solid #1e1e3a"
      }}>
        <div style={{ fontSize: 11, color: "#6c63ff", letterSpacing: 2, textTransform: "uppercase" }}>
          {workout.phase}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{workout.day}</div>
        <div style={{ fontSize: 14, color: "#8888aa", marginTop: 2 }}>{workout.subtitle}</div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8888aa", marginBottom: 6 }}>
            <span>{doneSets}/{totalSets} sets done</span>
            <span style={{ color: progress === 100 ? "#4ade80" : "#6c63ff" }}>{progress}%</span>
          </div>
          <div style={{ background: "#1e1e3a", borderRadius: 99, height: 6 }}>
            <div style={{
              background: progress === 100 ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, #6c63ff, #a78bfa)",
              width: `${progress}%`,
              height: "100%",
              borderRadius: 99,
              transition: "width 0.4s ease"
            }} />
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        background: "#111118",
        borderBottom: "1px solid #1e1e3a",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px 4px",
              border: "none",
              background: "none",
              color: activeTab === tab.id ? "#a78bfa" : "#666680",
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid #6c63ff" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {activeTab === "workout" && (
          <div>
            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Warm Up — 5 min</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#f59e0b" }}>Required</span>
              </div>
              {["3 min easy treadmill walk (flat)", "10 arm circles each direction", "10 bodyweight squats"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13, color: "#ccccdd" }}>
                  <span style={{ color: "#6c63ff", fontSize: 11 }}>●</span> {item}
                </div>
              ))}
            </div>

            {workout.exercises.map((ex) => {
              const allSetsForEx = Array.from({ length: ex.sets }, (_, i) => `${ex.id}-${i + 1}`);
              const doneCount = allSetsForEx.filter(k => completedSets[k]).length;
              const exDone = doneCount === ex.sets;
              return (
                <div key={ex.id} style={{
                  background: exDone ? "#0d1f0f" : "#111118",
                  border: `1px solid ${exDone ? "#1a4d1f" : "#1e1e3a"}`,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  transition: "all 0.3s"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{ex.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                        {ex.name}
                        {exDone && <span style={{ fontSize: 14, color: "#4ade80" }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#8888aa", marginTop: 2 }}>
                        {ex.sets} sets · {ex.reps} · {ex.rest}
                      </div>
                    </div>
                    <a
                      href={ex.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#1a0000",
                        border: "1px solid #3a0000",
                        color: "#ff4444",
                        borderRadius: 8,
                        padding: "5px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      ▶ Video
                    </a>
                  </div>

                  <div style={{
                    background: "#0d0d1a",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#9999bb",
                    marginBottom: 12,
                    lineHeight: 1.5
                  }}>
                    💡 {ex.cue}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const key = `${ex.id}-${i + 1}`;
                      const done = completedSets[key];
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSet(ex.id, i + 1)}
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            borderRadius: 10,
                            border: done ? "none" : "1px solid #2a2a44",
                            background: done ? "linear-gradient(135deg, #6c63ff, #a78bfa)" : "#0d0d1a",
                            color: done ? "#fff" : "#666680",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {done ? "✓" : `Set ${i + 1}`}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => toggleTip(ex.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6c63ff",
                      fontSize: 12,
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 600
                    }}
                  >
                    {showTip[ex.id] ? "▲ Hide coach tip" : "▼ Coach tip"}
                  </button>
                  {showTip[ex.id] && (
                    <div style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "#110d22",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#c4b5fd",
                      lineHeight: 1.5
                    }}>
                      🎯 {ex.tip}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🏃</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Treadmill Cardio</div>
                  <div style={{ fontSize: 12, color: "#8888aa" }}>{workout.cardio.duration}</div>
                </div>
              </div>
              {workout.cardio.details.map((row, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  fontSize: 13,
                  borderTop: i > 0 ? "1px solid #1a1a28" : "none",
                  color: i === 2 ? "#8888aa" : "#f0f0f5"
                }}>
                  <span style={{ color: "#6c63ff", fontWeight: 600 }}>{row.time}</span>
                  <span>{row.speed}</span>
                  <span style={{ color: "#a78bfa" }}>{row.incline}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📝 Post-Workout Notes</div>
              <textarea
                placeholder="How did it feel? Any exercise that was hard? Weights used?"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setSavedNote(false); }}
                style={{
                  width: "100%",
                  background: "#0d0d1a",
                  border: "1px solid #2a2a44",
                  borderRadius: 8,
                  color: "#f0f0f5",
                  padding: 10,
                  fontSize: 13,
                  minHeight: 80,
                  resize: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
              <button
                onClick={() => setSavedNote(true)}
                style={{
                  marginTop: 8,
                  background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "10px 20px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                {savedNote ? "✓ Saved!" : "Save Notes"}
              </button>
            </div>

            {progress === 100 && (
              <div style={{
                background: "linear-gradient(135deg, #064e3b, #065f46)",
                border: "1px solid #047857",
                borderRadius: 14,
                padding: 20,
                textAlign: "center",
                marginBottom: 12
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#4ade80" }}>Day 1 Complete!</div>
                <div style={{ fontSize: 13, color: "#6ee7b7", marginTop: 4 }}>Come back and tackle Day 2 next.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "nutrition" && (
          <div>
            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 14,
              marginBottom: 12,
              fontSize: 13,
              color: "#a78bfa",
              lineHeight: 1.6
            }}>
              🥦 <strong>Veg Phase (2 weeks):</strong> Eggs + Paneer + Dal + Soya + 1 whey shake/day.
            </div>
            {meals.map((meal, i) => (
              <div key={i} style={{
                background: "#111118",
                border: "1px solid #1e1e3a",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{meal.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{meal.time}</div>
                    <div style={{ fontSize: 12, color: "#6c63ff" }}>{meal.time_label}</div>
                  </div>
                </div>
                {meal.options.map((opt, j) => (
                  <div key={j} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "6px 0",
                    fontSize: 13,
                    color: "#ccccdd",
                    borderTop: j > 0 ? "1px solid #1a1a28" : "none"
                  }}>
                    <span style={{ color: "#6c63ff", marginTop: 1 }}>◆</span>
                    {opt}
                  </div>
                ))}
                <div style={{
                  marginTop: 10,
                  padding: "7px 10px",
                  background: "#0d0d1a",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#8888aa"
                }}>
                  💬 {meal.note}
                </div>
              </div>
            ))}

            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📊 Daily Targets</div>
              {[
                { label: "Water", value: "3 litres", icon: "💧" },
                { label: "Ice cream / treats", value: "Max 2x/week", icon: "🍦" },
                { label: "Finish dinner by", value: "8:30 PM", icon: "🌙" },
                { label: "Protein every meal", value: "Non-negotiable", icon: "💪" },
                { label: "Steps", value: "7,000–8,000/day", icon: "🚶" }
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  fontSize: 13,
                  borderTop: i > 0 ? "1px solid #1a1a28" : "none"
                }}>
                  <span style={{ color: "#aaaacc" }}>{item.icon} {item.label}</span>
                  <span style={{ color: "#a78bfa", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 Week 1 Schedule</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {weekSchedule.map((d, i) => (
                  <div key={i} style={{
                    textAlign: "center",
                    padding: "10px 4px",
                    borderRadius: 10,
                    background: d.active ? "linear-gradient(135deg, #1a1535, #2a1f55)" : "#0d0d1a",
                    border: d.active ? "1px solid #6c63ff" : "1px solid #1a1a28"
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{d.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: d.active ? "#a78bfa" : "#666680" }}>{d.day}</div>
                    <div style={{ fontSize: 9, color: d.active ? "#8877dd" : "#444460", marginTop: 2 }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🗺️ Your 12-Week Plan</div>
              {[
                { phase: "Phase 1", weeks: "Week 1–2", focus: "Rebuild", desc: "3 days/week, foundational strength & form", color: "#6c63ff" },
                { phase: "Phase 2", weeks: "Week 3–8", focus: "Fat Burn", desc: "4 days/week, higher volume + cardio", color: "#a78bfa" },
                { phase: "Phase 3", weeks: "Week 9–12", focus: "Accelerate", desc: "Supersets, progressive overload", color: "#4ade80" }
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: i > 0 ? "1px solid #1a1a28" : "none"
                }}>
                  <div style={{ width: 4, borderRadius: 99, background: p.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{p.phase}</span>
                      <span style={{ fontSize: 11, color: p.color, background: "#1a1a28", padding: "1px 6px", borderRadius: 6 }}>{p.focus}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6c63ff", marginBottom: 2 }}>{p.weeks}</div>
                    <div style={{ fontSize: 12, color: "#8888aa" }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🎯 Weekly Milestones</div>
              {[
                { week: "Week 1–2", milestone: "Gym 3x without skipping. Drink 3L water daily." },
                { week: "Week 3–4", milestone: "Gym 4x. Clothes feeling slightly looser. Energy up." },
                { week: "Week 5–6", milestone: "Strength noticeably better. Face/jaw looking leaner." },
                { week: "Week 7–8", milestone: "Visible difference in photos. Scale down 3–5kg." },
                { week: "Week 9–12", milestone: "Body transformed. Stamina significantly improved." }
              ].map((m, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 0",
                  borderTop: i > 0 ? "1px solid #1a1a28" : "none"
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid #2a2a44", background: "#0d0d1a", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#6c63ff", fontWeight: 600, marginBottom: 2 }}>{m.week}</div>
                    <div style={{ fontSize: 13, color: "#aaaacc" }}>{m.milestone}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: "#1a0d0d",
              border: "1px solid #3a1a1a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#fca5a5" }}>⚠️ Health Notes</div>
              {[
                { icon: "🦋", title: "Thyroid", note: "Fat loss may be slower — that's biology, not failure." },
                { icon: "😴", title: "Sleep", note: "Poor sleep stalls fat loss. Target 10:30pm–11pm bedtime." },
                { icon: "☕", title: "Coffee", note: "Coffee with milk is totally fine. Keep it before 3pm." }
              ].map((h, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 0",
                  borderTop: i > 0 ? "1px solid #2a1a1a" : "none"
                }}>
                  <span style={{ fontSize: 18 }}>{h.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#fca5a5", marginBottom: 2 }}>{h.title}</div>
                    <div style={{ fontSize: 12, color: "#cc9999" }}>{h.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
