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
      youtube: "https://www.youtube.com/results?search_query=incline+push+up+form+beginner",
      emoji: "🤸"
    },
    {
      id: "dumbbell-bench-press",
      name: "Dumbbell Bench Press",
      equipment: ["dumbbell", "gym"],
      reps: "10-12 reps",
      cue: "Lie flat, press dumbbells up over chest, control the descent",
      tip: "Don't let your elbows flare past 90°.",
      youtube: "https://www.youtube.com/results?search_query=dumbbell+bench+press+form",
      emoji: "🏋️"
    },
    {
      id: "shoulder-press",
      name: "Dumbbell Shoulder Press",
      equipment: ["dumbbell", "gym"],
      reps: "10-12 reps",
      cue: "Press dumbbells overhead, keep core tight, don't lean back",
      tip: "Exhale on the push, don't arch your lower back.",
      youtube: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+form",
      emoji: "💪"
    },
    {
      id: "barbell-bench-press",
      name: "Barbell Bench Press",
      equipment: ["gym"],
      reps: "8-10 reps",
      cue: "Grip slightly wider than shoulders, lower bar to chest, press up",
      tip: "Keep feet planted, don't bounce the bar off your chest.",
      youtube: "https://www.youtube.com/results?search_query=barbell+bench+press+form+beginner",
      emoji: "🏋️"
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
      youtube: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+proper+form",
      emoji: "💪"
    },
    {
      id: "bodyweight-row",
      name: "Table / Inverted Row",
      equipment: ["bodyweight"],
      reps: "10-12 reps",
      cue: "Grip a sturdy table edge or bar, body straight, pull chest up to it",
      tip: "Keep your body rigid — no sagging hips.",
      youtube: "https://www.youtube.com/results?search_query=inverted+row+bodyweight+form",
      emoji: "🧗"
    },
    {
      id: "lat-pulldown",
      name: "Cable Lat Pulldown",
      equipment: ["gym"],
      reps: "12 reps",
      cue: "Grip wide, lean back slightly, pull bar to upper chest, squeeze shoulder blades",
      tip: "Don't let the cable yank you back up. Control the return.",
      youtube: "https://www.youtube.com/results?search_query=lat+pulldown+form+for+beginners",
      emoji: "🎯"
    },
    {
      id: "bent-over-row",
      name: "Barbell Bent Over Row",
      equipment: ["gym"],
      reps: "10 reps",
      cue: "Hinge at hips, flat back, pull bar to lower ribs",
      tip: "Don't round your lower back — hinge, don't hunch.",
      youtube: "https://www.youtube.com/results?search_query=barbell+bent+over+row+form",
      emoji: "🏋️"
    }
  ],
  legs: [
    {
      id: "goblet-squat",
      name: "Goblet Squat",
      equipment: ["dumbbell", "gym"],
      reps: "12 reps",
      cue: "Hold dumbbell at chest, sit back like a chair, push through heels",
      tip: "Start with 5–8kg. Light is right today.",
      youtube: "https://www.youtube.com/results?search_query=goblet+squat+beginner+form",
      emoji: "🏋️"
    },
    {
      id: "bodyweight-squat",
      name: "Bodyweight Squat",
      equipment: ["bodyweight"],
      reps: "15-20 reps",
      cue: "Feet shoulder-width, sit back and down, chest up",
      tip: "Go as low as feels controlled — depth over speed.",
      youtube: "https://www.youtube.com/results?search_query=bodyweight+squat+form+beginner",
      emoji: "🦵"
    },
    {
      id: "lunges",
      name: "Walking Lunges",
      equipment: ["bodyweight", "dumbbell"],
      reps: "12 reps each leg",
      cue: "Step forward, drop back knee toward the floor, push back up",
      tip: "Keep your torso upright, don't lean forward.",
      youtube: "https://www.youtube.com/results?search_query=walking+lunges+form+beginner",
      emoji: "🚶"
    },
    {
      id: "leg-press",
      name: "Leg Press",
      equipment: ["gym"],
      reps: "12 reps",
      cue: "Feet shoulder-width on platform, lower with control, press through heels",
      tip: "Don't lock your knees out hard at the top.",
      youtube: "https://www.youtube.com/results?search_query=leg+press+form+beginner",
      emoji: "🦿"
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
      youtube: "https://www.youtube.com/results?search_query=how+to+plank+correctly+beginner",
      emoji: "🧘"
    },
    {
      id: "russian-twist",
      name: "Russian Twist",
      equipment: ["bodyweight", "dumbbell"],
      reps: "15 reps each side",
      cue: "Lean back slightly, feet off floor if you can, rotate side to side",
      tip: "Move slowly — twisting fast just uses momentum, not your core.",
      youtube: "https://www.youtube.com/results?search_query=russian+twist+form+beginner",
      emoji: "🌀"
    }
  ]
};
