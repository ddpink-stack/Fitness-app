// Rough calorie/macro estimates for common foods, keyed to a typical
// serving. Not lab-precise — meant for quick logging, editable per entry.
// `keywords` catches common spellings/variants the name itself won't
// substring-match (e.g. "sabji" vs "Sabzi").
//
// `diets` lists which of the app's diet answers this food fits, so
// search doesn't surface eggs/dairy/meat to someone who told us they
// don't eat them. Matches this app's own definitions: "vegetarian"
// includes eggs & dairy (see the questionnaire), "vegan" is strictly
// plant-based, "nonveg" includes everything.
const ALL_DIETS = ["vegetarian", "vegan", "nonveg"];
const VEG_OK = ["vegetarian", "nonveg"]; // contains egg and/or dairy, not vegan

export const foodDatabase = [
  { name: "Chapati / Roti", unit: "1 piece", calories: 80, protein: 3, carbs: 15, fat: 1, keywords: ["roti", "chapathi", "phulka"], diets: ALL_DIETS },
  { name: "Rice (cooked)", unit: "1 small bowl (100g)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, keywords: ["chawal", "bhaat"], diets: ALL_DIETS },
  { name: "Dal (cooked)", unit: "1 bowl", calories: 120, protein: 7, carbs: 18, fat: 2, keywords: ["daal", "lentil", "lentils"], diets: ALL_DIETS },
  { name: "Paneer", unit: "100g", calories: 265, protein: 18, carbs: 3, fat: 20, diets: VEG_OK },
  { name: "Egg (whole, boiled)", unit: "1 egg", calories: 78, protein: 6, carbs: 0.6, fat: 5, keywords: ["boiled egg", "anda"], diets: VEG_OK },
  { name: "Egg bhurji / scramble", unit: "2 eggs", calories: 180, protein: 12, carbs: 2, fat: 14, keywords: ["scrambled egg", "omelette", "omelet"], diets: VEG_OK },
  { name: "Chicken breast (cooked)", unit: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6, keywords: ["grilled chicken"], diets: ["nonveg"] },
  { name: "Chicken curry", unit: "1 serving", calories: 220, protein: 22, carbs: 6, fat: 12, keywords: ["murgh", "chicken gravy"], diets: ["nonveg"] },
  { name: "Fish curry", unit: "1 serving", calories: 200, protein: 20, carbs: 5, fat: 10, keywords: ["machli", "fish gravy"], diets: ["nonveg"] },
  { name: "Whey protein scoop", unit: "1 scoop", calories: 120, protein: 24, carbs: 3, fat: 1.5, keywords: ["protein shake"], diets: VEG_OK },
  { name: "Banana", unit: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, keywords: ["kela"], diets: ALL_DIETS },
  { name: "Apple", unit: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, keywords: ["seb"], diets: ALL_DIETS },
  { name: "Milk (full fat)", unit: "1 cup (250ml)", calories: 150, protein: 8, carbs: 12, fat: 8, keywords: ["doodh"], diets: VEG_OK },
  { name: "Curd / Yogurt", unit: "1 bowl", calories: 100, protein: 6, carbs: 8, fat: 5, keywords: ["dahi"], diets: VEG_OK },
  { name: "Peanut butter", unit: "2 tbsp", calories: 190, protein: 8, carbs: 6, fat: 16, diets: ALL_DIETS },
  { name: "Oats (cooked)", unit: "1 bowl", calories: 150, protein: 5, carbs: 27, fat: 3, keywords: ["oatmeal"], diets: ALL_DIETS },
  { name: "Sabzi (mixed vegetable)", unit: "1 serving", calories: 100, protein: 3, carbs: 12, fat: 5, keywords: ["sabji", "veg curry", "vegetable curry", "veggies", "carrot", "beans", "cauliflower", "gobi", "bhindi", "okra"], diets: ALL_DIETS },
  { name: "Rajma / Chana curry", unit: "1 bowl", calories: 180, protein: 9, carbs: 25, fat: 5, keywords: ["chole", "chickpea curry", "kidney bean"], diets: ALL_DIETS },
  { name: "Tofu", unit: "100g", calories: 145, protein: 16, carbs: 3, fat: 8, diets: ALL_DIETS },
  { name: "Tofu bhurji", unit: "1 serving", calories: 180, protein: 14, carbs: 5, fat: 12, keywords: ["tofu scramble"], diets: ALL_DIETS },
  { name: "Bread (white/brown)", unit: "2 slices", calories: 160, protein: 6, carbs: 30, fat: 2, keywords: ["toast"], diets: ALL_DIETS },
  { name: "Nuts (almonds/cashews)", unit: "small handful (~20g)", calories: 120, protein: 4, carbs: 5, fat: 10, keywords: ["almond", "cashew", "badam", "kaju"], diets: ALL_DIETS },
  { name: "Soya chunks curry", unit: "1 serving", calories: 150, protein: 13, carbs: 12, fat: 6, keywords: ["soy chunks", "nutrela"], diets: ALL_DIETS },
  { name: "Idli", unit: "2 pieces", calories: 120, protein: 4, carbs: 24, fat: 0.5, diets: ALL_DIETS },
  { name: "Dosa (plain)", unit: "1 piece", calories: 130, protein: 3, carbs: 20, fat: 4, diets: ALL_DIETS },
  { name: "Poha", unit: "1 bowl", calories: 180, protein: 4, carbs: 30, fat: 6, diets: ALL_DIETS },
  { name: "Upma", unit: "1 bowl", calories: 200, protein: 5, carbs: 32, fat: 6, diets: ALL_DIETS },
  { name: "Coffee / Tea with milk", unit: "1 cup", calories: 60, protein: 2, carbs: 8, fat: 2, keywords: ["chai"], diets: VEG_OK },
  { name: "Black coffee / tea", unit: "1 cup", calories: 5, protein: 0, carbs: 1, fat: 0, diets: ALL_DIETS },
  { name: "Chickpea flour chilla", unit: "1 piece", calories: 120, protein: 6, carbs: 15, fat: 4, keywords: ["besan chilla"], diets: ALL_DIETS },
  { name: "Overnight oats (soy milk + PB)", unit: "1 bowl", calories: 320, protein: 12, carbs: 40, fat: 12, diets: ALL_DIETS },
  { name: "Biscuits / Cookies", unit: "2 pieces", calories: 100, protein: 1.5, carbs: 16, fat: 4, diets: VEG_OK },
  { name: "Chips / namkeen", unit: "1 small pack (30g)", calories: 160, protein: 2, carbs: 16, fat: 10, diets: ALL_DIETS },
  { name: "Ice cream", unit: "1 scoop", calories: 140, protein: 2.5, carbs: 17, fat: 7, diets: VEG_OK },
  { name: "Chocolate", unit: "1 small bar (40g)", calories: 210, protein: 3, carbs: 24, fat: 12, diets: VEG_OK }
];

// Fallback estimates by broad food type, for when nothing in the
// database matches — gives a defensible starting number instead of
// asking the user to know a calorie count off the top of their head.
export const genericFoodCategories = [
  { label: "Vegetable curry / sabzi", calories: 100, protein: 3, carbs: 12, fat: 5 },
  { label: "Dal / lentil curry", calories: 120, protein: 7, carbs: 18, fat: 2 },
  { label: "Roti / chapati (1 piece)", calories: 80, protein: 3, carbs: 15, fat: 1 },
  { label: "Rice (1 bowl)", calories: 130, protein: 3, carbs: 28, fat: 0.3 },
  { label: "Non-veg curry (chicken/fish)", calories: 210, protein: 22, carbs: 5, fat: 11 },
  { label: "Paneer / tofu dish", calories: 220, protein: 15, carbs: 5, fat: 15 },
  { label: "Fruit (1 serving)", calories: 90, protein: 1, carbs: 23, fat: 0.3 },
  { label: "Snack / fried item", calories: 180, protein: 3, carbs: 18, fat: 10 },
  { label: "Sweet / dessert", calories: 160, protein: 2, carbs: 22, fat: 7 },
  { label: "Bread / toast", calories: 160, protein: 6, carbs: 30, fat: 2 }
];
