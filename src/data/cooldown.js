const STRETCHES_BY_CATEGORY = {
  legs: [
    "Standing quad stretch — 30 sec each leg",
    "Seated hamstring stretch — 30 sec each leg",
    "Calf wall stretch — 30 sec each leg"
  ],
  pull: ["Child's pose lat stretch — 30 sec", "Cat-cow stretch — 8 slow reps"],
  push: ["Doorway chest stretch — 30 sec each side", "Overhead triceps stretch — 30 sec each arm"],
  core: ["Cobra stretch — 30 sec", "Seated spinal twist — 30 sec each side"]
};

const CATEGORY_ORDER = ["legs", "pull", "push", "core"];
const FALLBACK_STRETCHES = ["Standing forward fold — 30 sec", "Deep breathing — 1 min"];

// Builds a short, relevant cooldown stretch list from the muscle
// categories trained that day (e.g. leg day gets an extra lower-body
// stretch), capped so it stays a quick 4-item routine.
export function buildCooldown(categories) {
  const present = new Set(categories);
  const stretches = [];
  for (const cat of CATEGORY_ORDER) {
    if (!present.has(cat)) continue;
    const list = STRETCHES_BY_CATEGORY[cat];
    stretches.push(list[0]);
    if (cat === "legs" && list[1]) stretches.push(list[1]);
  }
  return stretches.length ? stretches.slice(0, 4) : FALLBACK_STRETCHES;
}
