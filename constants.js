export const STORAGE_KEY = "tdee_food_tracker_state_v1";
export const USDA_KEY_STORAGE = "tdee_usda_api_key_v1";
export const CUSTOM_FOOD_STORAGE = "tdee_custom_foods_v1";
export const GEMINI_KEY_STORAGE = "tdee_gemini_api_key_v1";
export const GEMINI_CHAT_HISTORY_STORAGE = "tdee_gemini_chat_history_v1";

export let FOOD_DATABASE = [
  {
    id: "com_trang",
    name: "Cơm trắng",
    baseAmount: 100,
    unit: "g",
    calories: 130,
    protein: 2.7,
    carb: 28.2,
    fat: 0.3
  },
  {
    id: "uc_ga",
    name: "Ức gà (luộc)",
    baseAmount: 100,
    unit: "g",
    calories: 165,
    protein: 31,
    carb: 0,
    fat: 3.6
  },
  {
    id: "trung_ga",
    name: "Trứng gà",
    baseAmount: 50,
    unit: "g (1 quả vừa ~50g)",
    calories: 72,
    protein: 6.3,
    carb: 0.4,
    fat: 4.8
  },
  {
    id: "thi_bo_nac",
    name: "Thịt bò nạc",
    baseAmount: 100,
    unit: "g",
    calories: 217,
    protein: 26,
    carb: 0,
    fat: 12
  },
  {
    id: "ca_hoi",
    name: "Cá hồi",
    baseAmount: 100,
    unit: "g",
    calories: 208,
    protein: 20,
    carb: 0,
    fat: 13
  },
  {
    id: "khoai_lang",
    name: "Khoai lang",
    baseAmount: 100,
    unit: "g",
    calories: 86,
    protein: 1.6,
    carb: 20,
    fat: 0.1
  },
  {
    id: "yen_mach",
    name: "Yến mạch",
    baseAmount: 40,
    unit: "g",
    calories: 154,
    protein: 5.6,
    carb: 27,
    fat: 3
  },
  {
    id: "ca_com_kho",
    name: "Cá cơm khô",
    baseAmount: 100,
    unit: "g",
    calories: 410,
    protein: 62,
    carb: 0,
    fat: 17
  },
  {
    id: "tep_kho",
    name: "Tép khô",
    baseAmount: 100,
    unit: "g",
    calories: 300,
    protein: 60,
    carb: 2,
    fat: 4
  },
  {
    id: "ca_nuc",
    name: "Cá nục (nấu chín)",
    baseAmount: 100,
    unit: "g",
    calories: 200,
    protein: 24,
    carb: 0,
    fat: 11
  }
];

export const VI_TO_EN_FOOD_KEYWORDS = [
  { vi: ["cơm", "cơm trắng", "com trang"], en: "white rice" },
  { vi: ["gạo", "gao"], en: "rice" },
  { vi: ["ức gà", "uc ga", "bộ ngực gà"], en: "chicken breast" },
  { vi: ["thịt gà", "thit ga"], en: "chicken" },
  { vi: ["thịt bò", "thit bo", "bò"], en: "beef" },
  { vi: ["thịt heo", "thit heo", "thịt lợn", "thit lon"], en: "pork" },
  { vi: ["cá hồi", "ca hoi"], en: "salmon" },
  { vi: ["cá cơm", "ca com"], en: "anchovy" },
  { vi: ["tép", "tep", "tôm khô", "tom kho"], en: "dried shrimp" },
  { vi: ["cá nục", "ca nuc"], en: "mackerel" },
  { vi: ["cá", "ca"], en: "fish" },
  { vi: ["trứng", "trung", "trứng gà", "trung ga"], en: "egg" },
  { vi: ["khoai lang"], en: "sweet potato" },
  { vi: ["yến mạch", "yen mach"], en: "oats" },
  { vi: ["bánh mì", "banh mi"], en: "bread" },
  { vi: ["phở", "pho"], en: "noodle soup" },
  { vi: ["bún", "bun"], en: "rice vermicelli" },
  { vi: ["sữa", "sua"], en: "milk" },
  { vi: ["táo", "tao"], en: "apple" },
  { vi: ["chuối", "chuoi"], en: "banana" }
];

export const TRAINING_MODE_CONFIG = {
  recomp: {
    label: "Tăng cơ giảm mỡ",
    goalDelta: -250
  },
  fat_loss: {
    label: "Giảm mỡ",
    goalDelta: -500
  },
  weight_loss: {
    label: "Giảm cân mạnh",
    goalDelta: -750
  },
  muscle_gain: {
    label: "Tăng cơ",
    goalDelta: 250
  },
  weight_gain: {
    label: "Tăng cân",
    goalDelta: 300
  },
  high_protein_low_carb: { // New mode
    label: "High Protein - Low Carb (Tập tạ)",
    goalDelta: -500, // Fixed goal for this mode (Giảm mỡ)
    proteinPerKg: 2.5, // Fixed protein for this mode (average of 2.2-2.6)
    fatPerKg: 0.9     // Fixed fat for this mode (average of 0.8-1)
  },
  custom: {
    label: "Tự chỉnh",
    goalDelta: null
  }
};

export const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
