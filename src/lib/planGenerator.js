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

export function generateWeekPlan(profile) {
  const { daysPerWeek, equipment, level, goal, diet } = profile;
  const template = splitTemplates[daysPerWeek] ?? splitTemplates[3];
  const available = availableEquipment(equipment);
  const sets = setsByLevel[level] ?? 3;
  const rest = restByLevel[level] ?? "60 sec rest";
  const cardioMinutes = cardioMinutesByGoal[goal] ?? 20;

  const trainingDays = template.map((dayTemplate, dayIndex) => {
    const used = new Set();
    const exercises = dayTemplate.categories.map((category, slotIndex) => {
      const picked = pickExercise(category, dayIndex, slotIndex, available, used);
      return { ...picked, sets, rest };
    });

    return {
      id: `day-${dayIndex}`,
      label: dayTemplate.label,
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
  const trainIdx = trainingDayIndexes[daysPerWeek] ?? trainingDayIndexes[3];
  const weekSchedule = slots.map((weekday, i) => {
    const trainingSlot = trainIdx.indexOf(i);
    if (trainingSlot !== -1) {
      return { day: weekday, label: trainingDays[trainingSlot].label, active: true, icon: "🏋️", trainingDayId: trainingDays[trainingSlot].id };
    }
    const isWeekend = weekday === "Sat" || weekday === "Sun";
    return { day: weekday, label: isWeekend ? "Rest" : "Walk", active: false, icon: isWeekend ? "😴" : "🚶", trainingDayId: null };
  });

  return {
    trainingDays,
    weekSchedule,
    nutrition: mealPlansByDiet[diet] ?? mealPlansByDiet.vegetarian
  };
}
