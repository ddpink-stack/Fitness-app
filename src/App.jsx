import { useEffect, useMemo, useState } from "react";
import Questionnaire from "./components/Questionnaire.jsx";
import { generateWeekPlan } from "./lib/planGenerator.js";

const PROFILE_KEY = "fitness-app:profile";
const PROGRESS_KEY = "fitness-app:progress";

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
  const [activeTab, setActiveTab] = useState("workout");
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [showTip, setShowTip] = useState({});
  const [showVideo, setShowVideo] = useState({});
  const [savedNote, setSavedNote] = useState(false);

  const plan = useMemo(() => (profile ? generateWeekPlan(profile) : null), [profile]);

  useEffect(() => {
    if (plan && !selectedDayId) {
      setSelectedDayId(plan.trainingDays[0].id);
    }
  }, [plan, selectedDayId]);

  useEffect(() => {
    saveJSON(PROGRESS_KEY, progress);
  }, [progress]);

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
    setProfile(null);
    setProgress({});
    setSelectedDayId(null);
  };

  const workout = plan.trainingDays.find((d) => d.id === selectedDayId) ?? plan.trainingDays[0];
  const dayProgress = progress[workout.id] ?? { completedSets: {}, notes: "" };

  const setDayProgress = (updater) => {
    setProgress((prev) => {
      const current = prev[workout.id] ?? { completedSets: {}, notes: "" };
      return { ...prev, [workout.id]: updater(current) };
    });
    setSavedNote(false);
  };

  const toggleSet = (exerciseId, setNum) => {
    const key = `${exerciseId}-${setNum}`;
    setDayProgress((current) => ({
      ...current,
      completedSets: { ...current.completedSets, [key]: !current.completedSets[key] }
    }));
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
      workout.exercises.forEach((ex, exIndex) => {
        const exUid = `${workout.id}-${ex.id}-${exIndex}`;
        for (let i = 1; i <= ex.sets; i++) completedSets[`${exUid}-${i}`] = true;
      });
      return { ...current, completedSets };
    });
  };

  const toggleTip = (id) => {
    setShowTip((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleVideo = (id) => {
    setShowVideo((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const doneSets = Object.values(dayProgress.completedSets).filter(Boolean).length;
  const progressPct = Math.round((doneSets / totalSets) * 100) || 0;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 11, color: "#6c63ff", letterSpacing: 2, textTransform: "uppercase" }}>
            Your Plan
          </div>
          <button
            onClick={retakeQuestionnaire}
            style={{ background: "none", border: "none", color: "#666680", fontSize: 11, cursor: "pointer", padding: 0 }}
          >
            Retake questionnaire
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 10, paddingBottom: 2 }}>
          {plan.trainingDays.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDayId(d.id)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 99,
                border: d.id === workout.id ? "1px solid #6c63ff" : "1px solid #1e1e3a",
                background: d.id === workout.id ? "rgba(108,99,255,0.15)" : "transparent",
                color: d.id === workout.id ? "#a78bfa" : "#666680",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {d.dateLabel}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 14 }}>{workout.label}</div>
        <div style={{ fontSize: 12, color: "#8888aa", marginTop: 2 }}>{workout.dateLabel}</div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8888aa", marginBottom: 6 }}>
            <span>{doneSets}/{totalSets} sets done</span>
            <span style={{ color: progressPct === 100 ? "#4ade80" : "#6c63ff" }}>{progressPct}%</span>
          </div>
          <div style={{ background: "#1e1e3a", borderRadius: 99, height: 6 }}>
            <div style={{
              background: progressPct === 100 ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, #6c63ff, #a78bfa)",
              width: `${progressPct}%`,
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

            {workout.exercises.map((ex, exIndex) => {
              const exUid = `${workout.id}-${ex.id}-${exIndex}`;
              const allSetsForEx = Array.from({ length: ex.sets }, (_, i) => `${exUid}-${i + 1}`);
              const doneCount = allSetsForEx.filter(k => dayProgress.completedSets[k]).length;
              const exDone = doneCount === ex.sets;
              return (
                <div key={exUid} style={{
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
                      {ex.weightsBySet && (
                        <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 2, fontWeight: 600 }}>
                          🏋️ Ramp up: {ex.weightsBySet.join(" → ")}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleVideo(exUid)}
                      style={{
                        background: "#1a0000",
                        border: "1px solid #3a0000",
                        color: "#ff4444",
                        borderRadius: 8,
                        padding: "5px 10px",
                        fontSize: 11,
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

                  {showVideo[exUid] && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "56.25%",
                        borderRadius: 8,
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
                        style={{ display: "inline-block", marginTop: 6, fontSize: 11, color: "#6c63ff", textDecoration: "none" }}
                      >
                        Open in YouTube ↗
                      </a>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const key = `${exUid}-${i + 1}`;
                      const done = dayProgress.completedSets[key];
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSet(exUid, i + 1)}
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
                          <div>{done ? "✓" : `Set ${i + 1}`}</div>
                          {ex.weightsBySet && (
                            <div style={{
                              fontSize: 9,
                              fontWeight: 600,
                              marginTop: 2,
                              opacity: done ? 0.9 : 0.75
                            }}>
                              {ex.weightsBySet[i]}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => toggleTip(exUid)}
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
                      {showTip[exUid] ? "▲ Hide coach tip" : "▼ Coach tip"}
                    </button>
                    {!exDone && (
                      <button
                        onClick={() => completeAllSets(exUid, ex.sets)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#4ade80",
                          fontSize: 12,
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 600
                        }}
                      >
                        ✓ Mark all sets done
                      </button>
                    )}
                  </div>
                  {showTip[exUid] && (
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
                  color: i === workout.cardio.details.length - 1 ? "#8888aa" : "#f0f0f5"
                }}>
                  <span style={{ color: "#6c63ff", fontWeight: 600 }}>{row.time}</span>
                  <span>{row.speed}</span>
                  <span style={{ color: "#a78bfa" }}>{row.incline}</span>
                </div>
              ))}
            </div>

            {progressPct < 100 && (
              <button
                onClick={finishWorkout}
                style={{
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  border: "none",
                  borderRadius: 14,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "14px 20px",
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 12
                }}
              >
                ✅ Finish Workout — mark remaining sets done
              </button>
            )}

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
                value={dayProgress.notes}
                onChange={(e) => setDayProgress((current) => ({ ...current, notes: e.target.value }))}
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

            {progressPct === 100 && (
              <div style={{
                background: "linear-gradient(135deg, #064e3b, #065f46)",
                border: "1px solid #047857",
                borderRadius: 14,
                padding: 20,
                textAlign: "center",
                marginBottom: 12
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#4ade80" }}>{workout.label} Complete!</div>
                <div style={{ fontSize: 13, color: "#6ee7b7", marginTop: 4 }}>Come back and tackle your next day.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "nutrition" && (
          <div>
            {plan.nutrition.map((meal, i) => (
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
                { label: "Treats", value: "Max 2x/week", icon: "🍦" },
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
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 Your Week</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {plan.weekSchedule.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => d.trainingDayId && setSelectedDayId(d.trainingDayId)}
                    style={{
                      textAlign: "center",
                      padding: "10px 4px",
                      borderRadius: 10,
                      background: d.active ? "linear-gradient(135deg, #1a1535, #2a1f55)" : "#0d0d1a",
                      border: d.active ? "1px solid #6c63ff" : "1px solid #1a1a28",
                      cursor: d.trainingDayId ? "pointer" : "default"
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{d.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: d.active ? "#a78bfa" : "#666680" }}>{d.day} {d.dateNum}</div>
                    <div style={{ fontSize: 9, color: d.active ? "#8877dd" : "#444460", marginTop: 2 }}>{d.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
