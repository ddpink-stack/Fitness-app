import { useState } from "react";
import { dietLabels } from "../data/meals.js";

const questions = [
  {
    key: "goal",
    label: "What's your main goal?",
    options: [
      { value: "fat-loss", label: "Fat Loss", desc: "Lean out, more cardio" },
      { value: "muscle-gain", label: "Muscle Gain", desc: "Build strength & size" },
      { value: "general-fitness", label: "General Fitness", desc: "Balanced, stay active" }
    ]
  },
  {
    key: "level",
    label: "What's your experience level?",
    options: [
      { value: "beginner", label: "Beginner", desc: "New to structured training" },
      { value: "intermediate", label: "Intermediate", desc: "6+ months consistent" },
      { value: "advanced", label: "Advanced", desc: "2+ years, know your lifts" }
    ]
  },
  {
    key: "daysPerWeek",
    label: "How many days a week can you train?",
    options: [
      { value: 3, label: "3 days", desc: "Full body split" },
      { value: 4, label: "4 days", desc: "Upper / lower split" },
      { value: 5, label: "5 days", desc: "Push / pull / legs split" }
    ]
  },
  {
    key: "equipment",
    label: "What equipment do you have?",
    options: [
      { value: "bodyweight", label: "Bodyweight only", desc: "No equipment" },
      { value: "dumbbell", label: "Dumbbells at home", desc: "A basic home setup" },
      { value: "gym", label: "Full gym access", desc: "Barbells, cables, machines" }
    ]
  },
  {
    key: "diet",
    label: "What's your diet preference?",
    options: [
      { value: "vegetarian", label: dietLabels.vegetarian, desc: "Eggs & dairy okay" },
      { value: "vegan", label: dietLabels.vegan, desc: "No animal products" },
      { value: "nonveg", label: dietLabels.nonveg, desc: "Includes meat & fish" }
    ]
  }
];

export default function Questionnaire({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = questions[step];
  const isLast = step === questions.length - 1;

  const choose = (value) => {
    const next = { ...answers, [question.key]: value };
    setAnswers(next);
    if (isLast) {
      onComplete(next);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#f0f0f5",
      maxWidth: 420,
      margin: "0 auto",
      padding: "24px 20px",
      boxSizing: "border-box"
    }}>
      <div style={{ fontSize: 11, color: "#6c63ff", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        Step {step + 1} of {questions.length}
      </div>
      <div style={{ background: "#1e1e3a", borderRadius: 99, height: 4, marginBottom: 28 }}>
        <div style={{
          background: "linear-gradient(90deg, #6c63ff, #a78bfa)",
          width: `${((step + 1) / questions.length) * 100}%`,
          height: "100%",
          borderRadius: 99,
          transition: "width 0.3s ease"
        }} />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{question.label}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => choose(opt.value)}
            style={{
              textAlign: "left",
              background: "#111118",
              border: "1px solid #1e1e3a",
              borderRadius: 14,
              padding: "16px 18px",
              color: "#f0f0f5",
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</div>
            <div style={{ fontSize: 12, color: "#8888aa", marginTop: 2 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          style={{
            marginTop: 20,
            background: "none",
            border: "none",
            color: "#6c63ff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0
          }}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
