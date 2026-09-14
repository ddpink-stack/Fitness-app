import { exerciseLibrary, availableEquipment } from "../data/exercises.js";
import { mealPlansByDiet } from "../data/meals.js";

const setsByLevel = { beginner: 3, intermediate: 3, advanced: 4 };
const restByLevel = { beginner: "60 sec rest", intermediate: "60 sec rest", advanced: "45 sec rest" };
const cardioMinutesByGoal = { "fat-loss": 25, "general-fitness": 20, "muscle-gain": 15 };

// Each entry lists the muscle categories trained that day. A repeated
// category (e.g. "push","push") means two different push exercises.
const splitTemplates = {
  3: [
    { label: "Full Body A", categories: ["push", "pull", "legs", "core"] },
    { label: "Full Body B", categories: ["pull", "legs", "push", "core"] },
    { label: "Full Body C", categories: ["legs", "push", "pull", "core"] }
  ],
  4: [
    { label: "Upper A", categories: ["push", "pull", "push", "core"] },
    { label: "Lower A", categories: ["legs", "legs", "core"] },
    { label: "Upper B", categories: ["pull", "push", "pull", "core"] },
    { label: "Lower B", categories: ["legs", "legs", "core"] }
  ],
  5: [
    { label: "Push Day", categories: ["push", "push", "core"] },
    { label: "Pull Day", categories: ["pull", "pull", "core"] },
    { label: "Legs Day", categories: ["legs", "legs", "core"] },
    { label: "Upper Day", categories: ["push", "pull", "core"] },
    { label: "Lower Day", categories: ["legs", "core"] }
  ]
};

// Maps a training-day count onto real weekdays, filling the rest with
// walk/rest days so the Schedule tab shows a full week.
const weekdaySlots = {
  3: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  4: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  5: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
};
const trainingDayIndexes = {
  3: [0, 2, 4], // Mon, Wed, Fri
  4: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
  5: [0, 1, 2, 3, 4] // Mon–Fri
};

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun … 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// Ramps weight up across sets (lighter warm-up set -> heavier working
// sets), like a trainer coaching you through a session, rounded to a
// sensible increment for the equipment (dumbbells vs. barbell plates).
function rampWeights(min, max, count, step) {
  const raw = Array.from({ length: count }, (_, i) =>
    count === 1 ? max : min + ((max - min) * i) / (count - 1)
  );
  const rounded = raw.map((w) => Math.round(w / step) * step);
  for (let i = 1; i < rounded.length; i++) {
    if (rounded[i] < rounded[i - 1]) rounded[i] = rounded[i - 1];
  }
  return rounded;
}

function formatWeight(value, unit) {
  const num = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return `${num} ${unit}`;
}

// Base suggestedWeight ranges assume a ~70kg adult male in his late 20s.
// These factors shift that baseline toward the person actually training,
// since a flat number-per-level ignores who's lifting it.
const REFERENCE_BODYWEIGHT_KG = 70;

// Rough, general strength-norm ratios (untrained/early-trained lifters):
// upper-body pushing/pulling strength differs by sex more than leg
// strength does, so scale each muscle group separately.
const sexFactorByCategory = {
  male: { push: 1, pull: 1, legs: 1 },
  female: { push: 0.6, pull: 0.65, legs: 0.78 },
  unspecified: { push: 0.8, pull: 0.82, legs: 0.9 }
};

function sexFactor(category, sex) {
  const group = sexFactorByCategory[sex];
  if (!group) return 1; // no answer on file (e.g. profile saved before this existed)
  return group[category] ?? 1;
}

function ageFactor(age) {
  if (!age) return 1;
  if (age < 40) return 1;
  if (age < 50) return 0.92;
  if (age < 60) return 0.85;
  return 0.75;
}

function bodyweightFactor(bodyWeightKg) {
  if (!bodyWeightKg) return 1;
  const raw = bodyWeightKg / REFERENCE_BODYWEIGHT_KG;
  return Math.min(1.5, Math.max(0.6, raw));
}

function personalizationScale(category, profile) {
  const scale = bodyweightFactor(profile.bodyWeight) * sexFactor(category, profile.sex) * ageFactor(profile.age);
  return Math.min(1.8, Math.max(0.45, scale));
}

function pickExercise(category, dayIndex, slotIndex, available, used) {
  const pool = exerciseLibrary[category].filter(
    (ex) => ex.equipment.some((e) => available.includes(e)) && !used.has(ex.id)
  );
  const chosen = pool.length > 0
    ? pool[(dayIndex + slotIndex) % pool.length]
    : exerciseLibrary[category][(dayIndex + slotIndex) % exerciseLibrary[category].length];
  used.add(chosen.id);
  return chosen;
}

export function generateWeekPlan(profile, referenceDate = new Date()) {
  const { daysPerWeek, equipment, level, goal, diet } = profile;
  const template = splitTemplates[daysPerWeek] ?? splitTemplates[3];
  const available = availableEquipment(equipment);
  const sets = setsByLevel[level] ?? 3;
  const rest = restByLevel[level] ?? "60 sec rest";
  const cardioMinutes = cardioMinutesByGoal[goal] ?? 20;
  const monday = startOfWeekMonday(referenceDate);
  const trainIdx = trainingDayIndexes[daysPerWeek] ?? trainingDayIndexes[3];

  const trainingDays = template.map((dayTemplate, dayIndex) => {
    const used = new Set();
    const exercises = dayTemplate.categories.map((category, slotIndex) => {
      const picked = pickExercise(category, dayIndex, slotIndex, available, used);
      const weightConf = picked.suggestedWeight;
      const range = weightConf ? weightConf[level] : null;
      let weightsBySet = null;
      if (range) {
        const scale = personalizationScale(category === "core" ? "pull" : category, profile);
        let min = range.min * scale;
        let max = range.max * scale;
        if (weightConf.equipmentFloor) {
          min = Math.max(min, weightConf.equipmentFloor);
          max = Math.max(max, weightConf.equipmentFloor);
        }
        weightsBySet = rampWeights(min, max, sets, weightConf.step ?? 1).map((w) => formatWeight(w, weightConf.unit));
      }
      return { ...picked, sets, rest, weightsBySet };
    });

    const date = new Date(monday);
    date.setDate(date.getDate() + trainIdx[dayIndex]);

    return {
      id: `day-${dayIndex}`,
      label: dayTemplate.label,
      date: date.toISOString(),
      dateLabel: formatDayLabel(date),
      exercises,
      cardio: {
        duration: `${cardioMinutes} min`,
        details: [
          { time: `0–5 min`, speed: "4.5 kmph", incline: "Incline 3" },
          { time: `5–${cardioMinutes - 5} min`, speed: "5.5 kmph", incline: "Incline 5" },
          { time: `${cardioMinutes - 5}–${cardioMinutes} min`, speed: "4.0 kmph", incline: "Incline 2 (cool down)" }
        ]
      }
    };
  });

  const slots = weekdaySlots[daysPerWeek] ?? weekdaySlots[3];
  const weekSchedule = slots.map((weekday, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const trainingSlot = trainIdx.indexOf(i);
    if (trainingSlot !== -1) {
      return {
        day: weekday,
        dateNum: date.getDate(),
        label: trainingDays[trainingSlot].label,
        active: true,
        icon: "🏋️",
        trainingDayId: trainingDays[trainingSlot].id
      };
    }
    const isWeekend = weekday === "Sat" || weekday === "Sun";
    return {
      day: weekday,
      dateNum: date.getDate(),
      label: isWeekend ? "Rest" : "Walk",
      active: false,
      icon: isWeekend ? "😴" : "🚶",
      trainingDayId: null
    };
  });

  return {
    trainingDays,
    weekSchedule,
    nutrition: mealPlansByDiet[diet] ?? mealPlansByDiet.vegetarian
  };
}
