// Equipment tiers are cumulative: gym unlocks dumbbell + bodyweight exercises too.
export function availableEquipment(userEquipment) {
  if (userEquipment === "gym") return ["gym", "dumbbell", "bodyweight"];
  if (userEquipment === "dumbbell") return ["dumbbell", "bodyweight"];
  return ["bodyweight"];
}

// What training this movement pattern is generally doing for the body —
// shown alongside an exercise's specific muscles in the "info" panel.
export const categoryPurpose = {
  push: "Pushing movements build your chest, shoulders, and triceps — the muscles that press weight away from your body. Strong pushing strength shows up as upper-body size and everyday tasks like pushing a door or getting up from the floor.",
  pull: "Pulling movements build your back and biceps — the muscles that draw weight toward your body. This is what counteracts hours of sitting/hunching and builds the width and thickness that make a physique look strong from behind.",
  legs: "Leg movements train your quads, hamstrings, and glutes — the biggest muscles in your body. They burn the most calories per session, build lower-body strength, and support almost every other exercise and daily movement.",
  core: "Core work trains your abs and the stabilizing muscles around your spine. It's not really about visible abs — it's what keeps your torso stable and your lower back safe during every other lift."
};

export const exerciseLibrary = {
  push: [
    {
      id: "incline-pushup",
      name: "Incline Push Up",
      equipment: ["bodyweight", "dumbbell", "gym"],
      reps: "10-12 reps",
      cue: "Hands on bench, body straight as a plank, lower chest toward bench",
      tip: "Don't let your hips sag. If too easy, go lower surface.",
      videoId: "0JUrOH--Kdk",
      emoji: "🤸",
      muscles: ["Chest", "Shoulders", "Triceps"]
    },
    {
      id: "dumbbell-bench-press",
      name: "Dumbbell Bench Press",
      equipment: ["dumbbell", "gym"],
      reps: "10-12 reps",
      cue: "Lie flat, press dumbbells up over chest, control the descent",
      tip: "Don't let your elbows flare past 90°.",
      videoId: "kgr3lCKx6_M",
      emoji: "🏋️",
      muscles: ["Chest", "Shoulders", "Triceps"],
      suggestedWeight: {
        unit: "kg each hand",
        step: 1,
        beginner: { min: 6, max: 8 },
        intermediate: { min: 10, max: 14 },
        advanced: { min: 16, max: 22 }
      }
    },
    {
      id: "shoulder-press",
      name: "Dumbbell Shoulder Press",
      equipment: ["dumbbell", "gym"],
      reps: "10-12 reps",
      cue: "Press dumbbells overhead, keep core tight, don't lean back",
      tip: "Exhale on the push, don't arch your lower back.",
      videoId: "1jYq9QQEWqE",
      emoji: "💪",
      muscles: ["Shoulders", "Triceps"],
      suggestedWeight: {
        unit: "kg each hand",
        step: 1,
        beginner: { min: 4, max: 6 },
        intermediate: { min: 8, max: 10 },
        advanced: { min: 12, max: 16 }
      }
    },
    {
      id: "barbell-bench-press",
      name: "Barbell Bench Press",
      equipment: ["gym"],
      reps: "8-10 reps",
      cue: "Grip slightly wider than shoulders, lower bar to chest, press up",
      tip: "Keep feet planted, don't bounce the bar off your chest.",
      videoId: "Pp8rHcFVIYg",
      emoji: "🏋️",
      muscles: ["Chest", "Shoulders", "Triceps"],
      suggestedWeight: {
        unit: "kg total",
        step: 2.5,
        equipmentFloor: 20,
        beginner: { min: 20, max: 20 },
        intermediate: { min: 40, max: 50 },
        advanced: { min: 60, max: 80 }
      }
    }
  ],
  pull: [
    {
      id: "dumbbell-row",
      name: "Single Arm Dumbbell Row",
      equipment: ["dumbbell", "gym"],
      reps: "12 reps each side",
      cue: "One knee on bench, pull elbow up toward ceiling, squeeze your back",
      tip: "Don't twist your body. Keep it slow and controlled.",
      videoId: "fURsHPHgssI",
      emoji: "💪",
      muscles: ["Back", "Biceps"],
      suggestedWeight: {
        unit: "kg",
        step: 1,
        beginner: { min: 6, max: 8 },
        intermediate: { min: 10, max: 14 },
        advanced: { min: 16, max: 22 }
      }
    },
    {
      id: "bodyweight-row",
      name: "Table / Inverted Row",
      equipment: ["bodyweight"],
      reps: "10-12 reps",
      cue: "Grip a sturdy table edge or bar, body straight, pull chest up to it",
      tip: "Keep your body rigid — no sagging hips.",
      videoId: "Fl0UMfdEzsE",
      emoji: "🧗",
      muscles: ["Back", "Biceps"]
    },
    {
      id: "lat-pulldown",
      name: "Cable Lat Pulldown",
      equipment: ["gym"],
      reps: "12 reps",
      cue: "Grip wide, lean back slightly, pull bar to upper chest, squeeze shoulder blades",
      tip: "Don't let the cable yank you back up. Control the return.",
      videoId: "Z_3xHwuO8Tk",
      emoji: "🎯",
      muscles: ["Back (lats)", "Biceps"],
      suggestedWeight: {
        unit: "kg",
        step: 5,
        beginner: { min: 15, max: 20 },
        intermediate: { min: 25, max: 35 },
        advanced: { min: 40, max: 55 }
      }
    },
    {
      id: "bent-over-row",
      name: "Barbell Bent Over Row",
      equipment: ["gym"],
      reps: "10 reps",
      cue: "Hinge at hips, flat back, pull bar to lower ribs",
      tip: "Don't round your lower back — hinge, don't hunch.",
      videoId: "Lf4LUL3FeUM",
      emoji: "🏋️",
      muscles: ["Back", "Biceps", "Rear shoulders"],
      suggestedWeight: {
        unit: "kg total",
        step: 2.5,
        equipmentFloor: 20,
        beginner: { min: 20, max: 20 },
        intermediate: { min: 35, max: 45 },
        advanced: { min: 50, max: 70 }
      }
    }
  ],
  legs: [
    {
      id: "goblet-squat",
      name: "Goblet Squat",
      equipment: ["dumbbell", "gym"],
      reps: "12 reps",
      cue: "Hold dumbbell at chest, sit back like a chair, push through heels",
      tip: "Keep your weight on your heels and chest tall.",
      videoId: "k_EhLGvM8TQ",
      emoji: "🏋️",
      muscles: ["Quads", "Glutes"],
      suggestedWeight: {
        unit: "kg",
        step: 1,
        beginner: { min: 6, max: 10 },
        intermediate: { min: 12, max: 16 },
        advanced: { min: 18, max: 24 }
      }
    },
    {
      id: "bodyweight-squat",
      name: "Bodyweight Squat",
      equipment: ["bodyweight"],
      reps: "15-20 reps",
      cue: "Feet shoulder-width, sit back and down, chest up",
      tip: "Go as low as feels controlled — depth over speed.",
      videoId: "P-yaD24bUE8",
      emoji: "🦵",
      muscles: ["Quads", "Glutes"]
    },
    {
      id: "lunges",
      name: "Walking Lunges",
      equipment: ["bodyweight", "dumbbell"],
      reps: "12 reps each leg",
      cue: "Step forward, drop back knee toward the floor, push back up",
      tip: "Keep your torso upright, don't lean forward.",
      videoId: "BenhAbJiTsw",
      emoji: "🚶",
      muscles: ["Quads", "Glutes", "Hamstrings"]
    },
    {
      id: "leg-press",
      name: "Leg Press",
      equipment: ["gym"],
      reps: "12 reps",
      cue: "Feet shoulder-width on platform, lower with control, press through heels",
      tip: "Don't lock your knees out hard at the top.",
      videoId: "8nm863C0c60",
      emoji: "🦿",
      muscles: ["Quads", "Glutes", "Hamstrings"],
      suggestedWeight: {
        unit: "kg (plus sled)",
        step: 5,
        beginner: { min: 20, max: 40 },
        intermediate: { min: 60, max: 90 },
        advanced: { min: 100, max: 140 }
      }
    }
  ],
  core: [
    {
      id: "plank",
      name: "Plank",
      equipment: ["bodyweight", "dumbbell", "gym"],
      reps: "20-30 seconds",
      cue: "Elbows under shoulders, body straight, breathe normally",
      tip: "Don't hold your breath. Quality over duration.",
      videoId: "62SXSsM8A2o",
      emoji: "🧘",
      muscles: ["Abs", "Lower back stability"]
    },
    {
      id: "russian-twist",
      name: "Russian Twist",
      equipment: ["bodyweight", "dumbbell"],
      reps: "15 reps each side",
      cue: "Lean back slightly, feet off floor if you can, rotate side to side",
      tip: "Move slowly — twisting fast just uses momentum, not your core.",
      videoId: "fPxO-FA8acM",
      emoji: "🌀",
      muscles: ["Obliques", "Abs"]
    }
  ]
};
