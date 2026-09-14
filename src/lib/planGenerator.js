import { exerciseLibrary, availableEquipment } from "../data/exercises.js";
import { mealPlansByDiet } from "../data/meals.js";
import { buildCooldown } from "../data/cooldown.js";

// "returning" (trained before, 2+ months off) gets beginner-like volume —
// coaching guidance is to rebuild volume before intensity during a comeback.
const setsByLevel = { beginner: 3, returning: 3, intermediate: 3, advanced: 4 };
const restByLevel = { beginner: "60 sec rest", returning: "60 sec rest", intermediate: "60 sec rest", advanced: "45 sec rest" };
const cardioMinutesByGoal = { "fat-loss": 25, "general-fitness": 20, "muscle-gain": 15 };

// Each entry lists the muscle categories trained that day. A repeated
// category (e.g. "push","push") means two different push exercises.
const splitTemplates = {
  3: [
    { label: "Full Body", categories: ["push", "pull", "legs", "core"] },
    { label: "Full Body", categories: ["pull", "legs", "push", "core"] },
    { label: "Full Body", categories: ["legs", "push", "pull", "core"] }
  ],
  4: [
    { label: "Upper Body", categories: ["push", "pull", "push", "core"] },
    { label: "Lower Body", categories: ["legs", "legs", "core"] },
    { label: "Upper Body", categories: ["pull", "push", "pull", "core"] },
    { label: "Lower Body", categories: ["legs", "legs", "core"] }
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

// "returning" (trained before, 2+ months off) has no hand-authored weight
// tier — it's derived 40% of the way from beginner to intermediate.
// Coaching guidance on retraining after a break says muscle memory lets
// returning lifters regain load faster than a true beginner, but they
// should still start well below where they left off, not at intermediate.
const RETURNING_BLEND_TOWARD_INTERMEDIATE = 0.4;

function getWeightRange(weightConf, level) {
  if (weightConf[level]) return weightConf[level];
  if (level === "returning" && weightConf.beginner && weightConf.intermediate) {
    const t = RETURNING_BLEND_TOWARD_INTERMEDIATE;
    return {
      min: weightConf.beginner.min + (weightConf.intermediate.min - weightConf.beginner.min) * t,
      max: weightConf.beginner.max + (weightConf.intermediate.max - weightConf.beginner.max) * t
    };
  }
  return weightConf.beginner ?? null;
}

// Shared by initial plan generation and exercise swaps, so both produce
// identical personalized numbers for the same exercise/level/profile.
export function computeWeightsBySet(exercise, category, level, sets, profile) {
  const weightConf = exercise.suggestedWeight;
  const range = weightConf ? getWeightRange(weightConf, level) : null;
  if (!range) return null;
  const scale = personalizationScale(category === "core" ? "pull" : category, profile);
  let min = range.min * scale;
  let max = range.max * scale;
  if (weightConf.equipmentFloor) {
    min = Math.max(min, weightConf.equipmentFloor);
    max = Math.max(max, weightConf.equipmentFloor);
  }
  return rampWeights(min, max, sets, weightConf.step ?? 1).map((w) => formatWeight(w, weightConf.unit));
}

// All exercises in a category the user's equipment can perform, in a
// stable order — used to cycle through swap alternatives for a slot.
export function getSwapPool(category, available) {
  return exerciseLibrary[category].filter((ex) => ex.equipment.some((e) => available.includes(e)));
}

// Rough starting-point calorie/macro targets from body weight + goal +
// training load — not a medical calculation (that needs height too),
// but a widely-used per-kg coaching heuristic that actually shifts with
// who's eating and what they're training for, unlike a flat number.
const kcalPerKgByGoal = { "fat-loss": 25, "general-fitness": 29, "muscle-gain": 36 };
const proteinPerKgByGoal = { "fat-loss": 2.0, "general-fitness": 1.6, "muscle-gain": 1.8 };
const activityFactorByLevel = { beginner: 0.95, returning: 0.95, intermediate: 1.0, advanced: 1.08 };
const goalTips = {
  "fat-loss": "Keep protein and veg high, go moderate on rice/chapati — the numbers above are your ceiling, not a target to hit exactly.",
  "muscle-gain": "Don't undereat — if you're not gaining over a couple of weeks, add an extra portion (rice, chapati, or a protein shake).",
  "general-fitness": "Balanced portions across the day — eat until comfortably full, no need to restrict."
};

export function computeNutritionTargets(profile) {
  const { bodyWeight, goal, level, daysPerWeek } = profile;
  const weight = bodyWeight || 70;
  const kcalPerKg = kcalPerKgByGoal[goal] ?? kcalPerKgByGoal["general-fitness"];
  const activityFactor = (activityFactorByLevel[level] ?? 1) * (1 + Math.max(0, (daysPerWeek || 3) - 3) * 0.02);
  const calories = Math.round((weight * kcalPerKg * activityFactor) / 10) * 10;
  const proteinG = Math.round(weight * (proteinPerKgByGoal[goal] ?? proteinPerKgByGoal["general-fitness"]));
  const proteinCal = proteinG * 4;
  const fatCal = calories * 0.25;
  const fatG = Math.round(fatCal / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinCal - fatCal) / 4));
  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    tip: goalTips[goal] ?? goalTips["general-fitness"]
  };
}

// Loading/technical complexity within a category, 1 (easiest) to 3
// (hardest) — see the `difficulty` field on each exerciseLibrary entry.
// A beginner should land on the easiest movement available; a returning
// lifter can handle the same complexity as an intermediate (technique
// carries over from before their break, even though their load won't).
const difficultyByLevel = { beginner: 1, returning: 2, intermediate: 2, advanced: 3 };

function pickExercise(category, dayIndex, slotIndex, available, used, level) {
  const pool = exerciseLibrary[category].filter(
    (ex) => ex.equipment.some((e) => available.includes(e)) && !used.has(ex.id)
  );
  const source = pool.length > 0 ? pool : exerciseLibrary[category];
  const target = difficultyByLevel[level] ?? 2;
  const closestDiff = Math.min(...source.map((ex) => Math.abs((ex.difficulty ?? 2) - target)));
  // Among exercises equally close to the target difficulty, rotate through
  // them by day/slot so the plan doesn't pick the exact same one forever.
  const candidates = source.filter((ex) => Math.abs((ex.difficulty ?? 2) - target) === closestDiff);
  const chosen = candidates[(dayIndex + slotIndex) % candidates.length];
  used.add(chosen.id);
  return chosen;
}

export function generateWeekPlan(profile, referenceDate = new Date(), customTrainIdx = null) {
  const { daysPerWeek, equipment, level, goal, diet } = profile;
  const template = splitTemplates[daysPerWeek] ?? splitTemplates[3];
  const available = availableEquipment(equipment);
  const sets = setsByLevel[level] ?? 3;
  const rest = restByLevel[level] ?? "60 sec rest";
  const cardioMinutes = cardioMinutesByGoal[goal] ?? 20;
  const monday = startOfWeekMonday(referenceDate);
  const trainIdx = customTrainIdx && customTrainIdx.length === daysPerWeek
    ? [...customTrainIdx].sort((a, b) => a - b)
    : (trainingDayIndexes[daysPerWeek] ?? trainingDayIndexes[3]);
  const weekdayAbbrevs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // A split's day names only need a weekday tag when the same name repeats
  // in the week (e.g. two "Upper Body" days) — otherwise it's just noise.
  const labelCounts = template.reduce((acc, t) => acc.set(t.label, (acc.get(t.label) ?? 0) + 1), new Map());

  const trainingDays = template.map((dayTemplate, dayIndex) => {
    const used = new Set();
    const exercises = dayTemplate.categories.map((category, slotIndex) => {
      const picked = pickExercise(category, dayIndex, slotIndex, available, used, level);
      const weightsBySet = computeWeightsBySet(picked, category, level, sets, profile);
      return { ...picked, sets, rest, category, weightsBySet };
    });

    const date = new Date(monday);
    date.setDate(date.getDate() + trainIdx[dayIndex]);
    const label = labelCounts.get(dayTemplate.label) > 1
      ? `${dayTemplate.label} (${weekdayAbbrevs[trainIdx[dayIndex]]})`
      : dayTemplate.label;

    return {
      id: `day-${dayIndex}`,
      label,
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
      },
      cooldown: {
        duration: "5 min",
        stretches: buildCooldown(dayTemplate.categories)
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
    nutrition: mealPlansByDiet[diet] ?? mealPlansByDiet.vegetarian,
    nutritionTargets: computeNutritionTargets(profile)
  };
}
