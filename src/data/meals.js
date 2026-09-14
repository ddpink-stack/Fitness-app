export const mealPlansByDiet = {
  vegetarian: [
    {
      time: "Breakfast",
      icon: "🍳",
      time_label: "7–8 AM",
      options: ["3–4 eggs (any style) + 2 chapatis", "Paneer bhurji + multigrain toast", "Egg bhurji + toast"],
      note: "Coffee with milk ✅ — totally fine"
    },
    {
      time: "Lunch",
      icon: "☀️",
      time_label: "12:30–2 PM",
      options: ["Dal + sabzi + 1–2 chapatis + curd", "Rajma/chana with small bowl rice", "Paneer sabzi + dal + rice"],
      note: "Biggest meal of the day. Don't restrict here."
    },
    {
      time: "Dinner",
      icon: "🌙",
      time_label: "7:30–8:30 PM",
      options: ["Soya chunks curry + sabzi + 1 chapati", "Paneer sabzi + dal + 1 chapati", "Egg curry + sabzi"],
      note: "Lighter than lunch. Finish by 8:30pm."
    },
    {
      time: "Post Workout",
      icon: "🥤",
      time_label: "After gym",
      options: ["1 scoop whey protein with water or milk"],
      note: "MuscleBlaze Biozyme or ON Gold Standard recommended"
    }
  ],
  vegan: [
    {
      time: "Breakfast",
      icon: "🥣",
      time_label: "7–8 AM",
      options: ["Tofu bhurji + multigrain toast", "Overnight oats with soy milk + peanut butter", "Chickpea flour (besan) chilla"],
      note: "Black coffee or soy milk coffee — totally fine"
    },
    {
      time: "Lunch",
      icon: "☀️",
      time_label: "12:30–2 PM",
      options: ["Rajma/chana with rice", "Dal + sabzi + 1–2 chapatis", "Tofu stir-fry with rice"],
      note: "Biggest meal of the day. Don't restrict here."
    },
    {
      time: "Dinner",
      icon: "🌙",
      time_label: "7:30–8:30 PM",
      options: ["Soya chunks curry + sabzi + 1 chapati", "Tofu sabzi + dal + 1 chapati", "Mixed lentil curry + veg"],
      note: "Lighter than lunch. Finish by 8:30pm."
    },
    {
      time: "Post Workout",
      icon: "🥤",
      time_label: "After gym",
      options: ["1 scoop pea/soy protein with water or soy milk"],
      note: "Look for a vegan-certified blend (e.g. pea + rice protein)"
    }
  ],
  nonveg: [
    {
      time: "Breakfast",
      icon: "🍳",
      time_label: "7–8 AM",
      options: ["3–4 eggs (any style) + 2 chapatis", "Oats with milk + boiled eggs", "Chicken sausage + toast"],
      note: "Coffee with milk ✅ — totally fine"
    },
    {
      time: "Lunch",
      icon: "☀️",
      time_label: "12:30–2 PM",
      options: ["Grilled chicken + rice + sabzi", "Fish curry + rice", "Chicken breast + dal + chapati"],
      note: "Biggest meal of the day. Don't restrict here."
    },
    {
      time: "Dinner",
      icon: "🌙",
      time_label: "7:30–8:30 PM",
      options: ["Grilled chicken/fish + sabzi", "Egg curry + sabzi + 1 chapati", "Chicken soup + veg stir-fry"],
      note: "Lighter than lunch. Finish by 8:30pm."
    },
    {
      time: "Post Workout",
      icon: "🥤",
      time_label: "After gym",
      options: ["1 scoop whey protein with water or milk"],
      note: "MuscleBlaze Biozyme or ON Gold Standard recommended"
    }
  ]
};

export const dietLabels = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  nonveg: "Non-vegetarian"
};
