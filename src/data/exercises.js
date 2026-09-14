// Equipment tiers are cumulative: gym unlocks dumbbell + bodyweight exercises too.
export function availableEquipment(userEquipment) {
  if (userEquipment === "gym") return ["gym", "dumbbell", "bodyweight"];
  if (userEquipment === "dumbbell") return ["dumbbell", "bodyweight"];
  return ["bodyweight"];
}

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
      emoji: "🤸"
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
      suggestedWeight: {
        beginner: "6–8 kg each hand",
        intermediate: "10–14 kg each hand",
        advanced: "16–22 kg each hand"
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
      suggestedWeight: {
        beginner: "4–6 kg each hand",
        intermediate: "8–10 kg each hand",
        advanced: "12–16 kg each hand"
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
      suggestedWeight: {
        beginner: "Empty bar (20 kg)",
        intermediate: "40–50 kg total",
        advanced: "60–80 kg total"
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
      suggestedWeight: {
        beginner: "6–8 kg",
        intermediate: "10–14 kg",
        advanced: "16–22 kg"
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
      emoji: "🧗"
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
      suggestedWeight: {
        beginner: "15–20 kg",
        intermediate: "25–35 kg",
        advanced: "40–55 kg"
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
      suggestedWeight: {
        beginner: "Empty bar (20 kg)",
        intermediate: "35–45 kg total",
        advanced: "50–70 kg total"
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
      suggestedWeight: {
        beginner: "6–10 kg",
        intermediate: "12–16 kg",
        advanced: "18–24 kg"
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
      emoji: "🦵"
    },
    {
      id: "lunges",
      name: "Walking Lunges",
      equipment: ["bodyweight", "dumbbell"],
      reps: "12 reps each leg",
      cue: "Step forward, drop back knee toward the floor, push back up",
      tip: "Keep your torso upright, don't lean forward.",
      videoId: "BenhAbJiTsw",
      emoji: "🚶"
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
      suggestedWeight: {
        beginner: "20–40 kg (plus sled)",
        intermediate: "60–90 kg (plus sled)",
        advanced: "100–140 kg (plus sled)"
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
      emoji: "🧘"
    },
    {
      id: "russian-twist",
      name: "Russian Twist",
      equipment: ["bodyweight", "dumbbell"],
      reps: "15 reps each side",
      cue: "Lean back slightly, feet off floor if you can, rotate side to side",
      tip: "Move slowly — twisting fast just uses momentum, not your core.",
      videoId: "fPxO-FA8acM",
      emoji: "🌀"
    }
  ]
};
