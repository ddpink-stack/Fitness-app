import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dietLabels } from "../data/meals.js";

const questions = [
  {
    key: "name",
    type: "text",
    label: "What should we call you?",
    hint: "Just for a friendly greeting — you can skip this.",
    placeholder: "e.g. Alex",
    skippable: true
  },
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
    key: "bodyWeight",
    type: "number",
    label: "What's your body weight?",
    hint: "Used to scale suggested starting weights to you — heavier or lighter than average shifts the numbers up or down.",
    unit: "kg",
    placeholder: "e.g. 70",
    min: 30,
    max: 250
  },
  {
    key: "age",
    type: "number",
    label: "What's your age?",
    hint: "Strength norms shift gradually with age — this fine-tunes the suggested weights.",
    unit: "years",
    placeholder: "e.g. 28",
    min: 10,
    max: 90
  },
  {
    key: "sex",
    label: "What's your biological sex?",
    hint: "This also affects typical strength norms used for weight suggestions.",
    options: [
      { value: "male", label: "Male", desc: "" },
      { value: "female", label: "Female", desc: "" },
      { value: "unspecified", label: "Prefer not to say", desc: "Uses a neutral average instead" }
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
  const [numberInput, setNumberInput] = useState("");
  const [textInput, setTextInput] = useState("");

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const isNumber = question.type === "number";
  const isText = question.type === "text";

  useEffect(() => {
    if (isNumber) {
      setNumberInput(answers[question.key] != null ? String(answers[question.key]) : "");
    }
    if (isText) {
      setTextInput(answers[question.key] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const choose = (value) => {
    const next = { ...answers, [question.key]: value };
    setAnswers(next);
    if (isLast) {
      onComplete(next);
    } else {
      setStep(step + 1);
    }
  };

  const submitNumber = () => {
    const num = parseFloat(numberInput);
    if (Number.isNaN(num) || num < question.min || num > question.max) return;
    choose(num);
  };

  const submitText = () => {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    choose(trimmed);
  };

  const skip = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "var(--bg)",
      minHeight: "100vh",
      color: "var(--text)",
      maxWidth: 420,
      margin: "0 auto",
      padding: "32px 24px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ fontSize: 12, color: "var(--accent-soft)", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
        Step {step + 1} of {questions.length}
      </div>
      <div style={{ background: "var(--inset)", borderRadius: 99, height: 6, marginBottom: 36 }}>
        <div style={{
          background: "var(--accent)",
          width: `${((step + 1) / questions.length) * 100}%`,
          height: "100%",
          borderRadius: 99,
          transition: "width 0.3s ease"
        }} />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: question.hint ? 10 : 28, lineHeight: 1.25, letterSpacing: -0.5 }}>{question.label}</h1>
      {question.hint && (
        <div style={{ fontSize: 15, color: "var(--text-dim)", marginBottom: 28, lineHeight: 1.6 }}>{question.hint}</div>
      )}

      {isText ? (
        <div>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder={question.placeholder}
            autoFocus
            style={{
              width: "100%",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px",
              color: "var(--text)",
              fontSize: 20,
              fontWeight: 700,
              boxSizing: "border-box"
            }}
          />
          <button
            onClick={submitText}
            disabled={textInput.trim() === ""}
            style={{
              marginTop: 16,
              width: "100%",
              background: textInput.trim() === "" ? "var(--inset)" : "var(--accent)",
              border: "none",
              borderRadius: 16,
              color: textInput.trim() === "" ? "var(--text-faint)" : "#fff",
              fontWeight: 700,
              fontSize: 16,
              padding: "17px 20px",
              cursor: textInput.trim() === "" ? "default" : "pointer"
            }}
          >
            Continue
          </button>
          {question.skippable && (
            <button
              onClick={skip}
              style={{
                marginTop: 14,
                width: "100%",
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0
              }}
            >
              Skip for now
            </button>
          )}
        </div>
      ) : isNumber ? (
        <div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              inputMode="decimal"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNumber()}
              placeholder={question.placeholder}
              min={question.min}
              max={question.max}
              autoFocus
              style={{
                width: "100%",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "20px 68px 20px 20px",
                color: "var(--text)",
                fontSize: 22,
                fontWeight: 700,
                boxSizing: "border-box"
              }}
            />
            <span style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-faint)",
              fontSize: 15,
              fontWeight: 600
            }}>
              {question.unit}
            </span>
          </div>
          <button
            onClick={submitNumber}
            disabled={numberInput === ""}
            style={{
              marginTop: 16,
              width: "100%",
              background: numberInput === "" ? "var(--inset)" : "var(--accent)",
              border: "none",
              borderRadius: 16,
              color: numberInput === "" ? "var(--text-faint)" : "#fff",
              fontWeight: 700,
              fontSize: 16,
              padding: "17px 20px",
              cursor: numberInput === "" ? "default" : "pointer"
            }}
          >
            Continue
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {question.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                textAlign: "left",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "18px 18px 18px 20px",
                color: "var(--text)",
                cursor: "pointer"
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 4 }}>{opt.desc}</div>}
              </div>
              <ChevronRight size={18} color="var(--text-faint)" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "var(--accent-soft)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start"
          }}
        >
          <ChevronLeft size={17} /> Back
        </button>
      )}
    </div>
  );
}
