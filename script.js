const STORAGE_KEY = "tdee_food_tracker_state_v1";
const USDA_KEY_STORAGE = "tdee_usda_api_key_v1";
const CUSTOM_FOOD_STORAGE = "tdee_custom_foods_v1";
const GEMINI_KEY_STORAGE = "tdee_gemini_api_key_v1"; // New: Gemini API key storage
const GEMINI_CHAT_HISTORY_STORAGE = "tdee_gemini_chat_history_v1"; // New: Gemini chat history storage

let FOOD_DATABASE = [
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

// Helper function to get local YYYY-MM-DD string
function getLocalISOString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to parse YYYY-MM-DD string into a local Date object
function parseLocalISOString(isoString) {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day); // month - 1 because Date month is 0-indexed
}

const defaultState = {
  profile: {
    gender: "male",
    age: 25,
    height: 170,
    weight: 65,
    activity: 1.375,
    goalDelta: -500,
    tdee: 0,
    targetCalories: 0,
    bmi: 0,
    trainingMode: "custom"
  },
  macroSettings: {
    proteinPerKg: 2,
    fatPerKg: 0.8,
    targetCalories: 0,
    targetProtein: 0,
    targetCarb: 0,
    targetFat: 0
  },
  foodEntries: {}, // Changed to object keyed by date
  dailyTotals: {}, // Stores daily nutrition totals, keyed by date
  dailyWeight: {}, // New: Stores daily weight, keyed by date
  currentDate: getLocalISOString(new Date()), // Tracks the current day for food entry
  calendarViewDate: getLocalISOString(new Date()), // Tracks the month/year currently displayed in calendar
  collapseStates: { // New: Stores collapse state for sections
    tdeeContent: false,
    macroContent: false,
    foodTrackerContent: false,
    usdaContent: false, // New collapse state for USDA section
    manualFoodContent: false, // New collapse state for Manual Food section
    geminiChatbotContent: false // New: Collapse state for Gemini Chatbot
  },
  geminiApiKey: "", // New: Gemini API key
  chatHistory: [] // New: Chat history for Gemini
};

let state = loadState();

// DOM refs
const genderButtons = document.querySelectorAll(".segmented-btn[data-gender]");
const genderInput = document.getElementById("gender");
const ageInput = document.getElementById("age");
const heightInput = document.getElementById("height");
const weightInput = document.getElementById("weight");
const activitySelect = document.getElementById("activity");
const goalSelect = document.getElementById("goal");
const trainingModeSelect = document.getElementById("trainingMode");
const tdeeForm = document.getElementById("tdeeForm");

const tdeeValueEl = document.getElementById("tdeeValue");
const targetCaloriesValueEl = document.getElementById("targetCaloriesValue");
const bmiValueEl = document.getElementById("bmiValue");
const trainingModeLabelEl = document.getElementById("trainingModeLabel");

const proteinPerKgInput = document.getElementById("proteinPerKg");
const fatPerKgInput = document.getElementById("fatPerKg");
const applyMacroBtn = document.getElementById("applyMacroBtn");

const caloriesSummaryEl = document.getElementById("caloriesSummary");
const proteinSummaryEl = document.getElementById("proteinSummary");
const carbSummaryEl = document.getElementById("carbSummary");
const fatSummaryEl = document.getElementById("fatSummary");

const caloriesProgressEl = document.getElementById("caloriesProgress");
const proteinProgressEl = document.getElementById("proteinProgress");
const carbProgressEl = document.getElementById("carbProgress");
const fatProgressEl = document.getElementById("fatProgress");

const foodSelect = document.getElementById("foodSelect");
const foodAmountInput = document.getElementById("foodAmount");
const foodBaseInfo = document.getElementById("foodBaseInfo");
const foodForm = document.getElementById("foodForm");
const foodTableBody = document.getElementById("foodTableBody");

const totalCaloriesEl = document.getElementById("totalCalories");
const totalProteinEl = document.getElementById("totalProtein");
const totalCarbEl = document.getElementById("totalCarb");
const totalFatEl = document.getElementById("totalFat"); // Fixed typo here

const resetDayBtn = document.getElementById("resetDayBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn"); // New: Export CSV button

// USDA elements
const usdaApiKeyInput = document.getElementById("usdaApiKey");
const usdaStatusEl = document.getElementById("usdaStatus");
const saveUsdaKeyBtn = document.getElementById("saveUsdaKeyBtn");
const usdaSearchInput = document.getElementById("usdaSearch");
const usdaSearchBtn = document.getElementById("usdaSearchBtn");
const usdaResultsSelect = document.getElementById("usdaResults");
const addUsdaFoodBtn = document = document.getElementById("addUsdaFoodBtn");

// Manual Food elements
const manualFoodNameInput = document.getElementById("manualFoodName");
const manualFoodBaseAmountInput = document.getElementById("manualFoodBaseAmount");
const manualFoodUnitInput = document.getElementById("manualFoodUnit");
const manualFoodCaloriesInput = document.getElementById("manualFoodCalories");
const manualFoodProteinInput = document.getElementById("manualFoodProtein");
const manualFoodCarbInput = document.getElementById("manualFoodCarb");
const manualFoodFatInput = document.getElementById("manualFoodFat");
const addManualFoodBtn = document.getElementById("addManualFoodBtn");


// Daily Chart elements
const dailyChartContainer = document.getElementById("dailyChartContainer");

// Daily Weight elements
const dailyWeightInput = document.getElementById("dailyWeightInput");
const saveDailyWeightBtn = document.getElementById("saveDailyWeightBtn");
const currentDailyWeightDisplay = document.getElementById("currentDailyWeightDisplay");

// Gemini Chatbot elements
const geminiApiKeyInput = document.getElementById("geminiApiKey");
const saveGeminiKeyBtn = document.getElementById("saveGeminiKeyBtn");
const geminiStatusEl = document.getElementById("geminiStatus");
const chatMessagesEl = document.getElementById("chatMessages");
const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const refreshChatBtn = document.getElementById("refreshChatBtn"); // New: Refresh Chat button


// Calendar elements
const selectedDateDisplayEl = document.getElementById("selectedDateDisplay");
const currentMonthYearEl = document.getElementById("currentMonthYear");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const calendarDaysGrid = document.getElementById("calendarDaysGrid");

let usdaApiKey = loadUsdaKey();
let geminiApiKey = loadGeminiKey(); // New: Load Gemini key
let usdaLastResults = [];

// mapping tiếng Việt -> tiếng Anh cho USDA
const VI_TO_EN_FOOD_KEYWORDS = [
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

// Ánh xạ chế độ -> gợi ý goalDelta (kcal)
const TRAINING_MODE_CONFIG = {
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

function normalizeVi(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapViToEnKeyword(rawQuery) {
  const norm = normalizeVi(rawQuery);
  if (!norm) return rawQuery;
  for (const item of VI_TO_EN_FOOD_KEYWORDS) {
    for (const viKey of item.vi) {
      const normKey = normalizeVi(viKey);
      if (norm.includes(normKey)) return item.en;
    }
  }
  return rawQuery;
}

// Giới tính
genderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const gender = btn.getAttribute("data-gender");
    genderInput.value = gender;
    state.profile.gender = gender;
    genderButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    saveState();
  });
});

// Thay đổi chế độ luyện tập -> cập nhật goalDelta gợi ý và macro per kg
trainingModeSelect.addEventListener("change", () => {
  const mode = trainingModeSelect.value;
  state.profile.trainingMode = mode;

  const cfg = TRAINING_MODE_CONFIG[mode] || TRAINING_MODE_CONFIG.custom;

  // Set goalDelta
  if (cfg.goalDelta !== null) {
    goalSelect.value = String(cfg.goalDelta);
    state.profile.goalDelta = cfg.goalDelta;
  } else {
    // If custom, use current value or default
    state.profile.goalDelta = Number(goalSelect.value) || defaultState.profile.goalDelta;
  }

  // Set proteinPerKg and fatPerKg inputs if defined for the mode
  if (cfg.proteinPerKg !== undefined) {
    proteinPerKgInput.value = cfg.proteinPerKg;
    fatPerKgInput.value = cfg.fatPerKg;
  } else {
    // Restore previous custom values if available, or default
    proteinPerKgInput.value = state.macroSettings.proteinPerKg;
    fatPerKgInput.value = state.macroSettings.fatPerKg;
  }

  saveState();
  calculateTDEEAndUpdateState();
  applyMacroFromPerKg(); // This will now use the updated input values or fixed values
  renderAll();
});

goalSelect.addEventListener("change", () => {
  const delta = Number(goalSelect.value) || 0;
  state.profile.goalDelta = delta;
  saveState();
  calculateTDEEAndUpdateState();
  applyMacroFromPerKg();
  renderAll();
});

tdeeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  updateProfileFromInputs();
  calculateTDEEAndUpdateState();
  applyMacroFromPerKg();
  renderAll();
  saveState();
});

applyMacroBtn.addEventListener("click", (e) => {
  e.preventDefault();
  updateProfileFromInputs();
  applyMacroFromPerKg();
  renderAll();
  saveState();
});

function updateProfileFromInputs() {
  state.profile.age = Number(ageInput.value) || state.profile.age;
  state.profile.height = Number(heightInput.value) || state.profile.height;
  state.profile.weight = Number(weightInput.value) || state.profile.weight;
  state.profile.activity = Number(activitySelect.value) || state.profile.activity;
  state.profile.goalDelta = Number(goalSelect.value) || state.profile.goalDelta;
  state.profile.trainingMode = trainingModeSelect.value || state.profile.trainingMode || "custom";
}

function calculateTDEEAndUpdateState() {
  const { gender, age, height, weight, activity, goalDelta } = state.profile;
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  const tdee = bmr * activity;
  let targetCalories = tdee + goalDelta;
  if (targetCalories < 1000) targetCalories = 1000;

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  state.profile.tdee = Math.round(tdee);
  state.profile.targetCalories = Math.round(targetCalories);
  state.profile.bmi = Number.isFinite(bmi) ? bmi : 0;
  state.macroSettings.targetCalories = state.profile.targetCalories;
}

function applyMacroFromPerKg() {
  // These values are now set by the trainingModeSelect handler or user input
  const proteinPerKg = Number(proteinPerKgInput.value) || state.macroSettings.proteinPerKg;
  const fatPerKg = Number(fatPerKgInput.value) || state.macroSettings.fatPerKg;

  state.macroSettings.proteinPerKg = proteinPerKg;
  state.macroSettings.fatPerKg = fatPerKg;

  const weight = state.profile.weight;
  const targetCalories = state.profile.targetCalories || state.macroSettings.targetCalories || 0;

  const targetProtein = proteinPerKg * weight;
  const targetFat = fatPerKg * weight;

  const caloriesFromProtein = targetProtein * 4;
  const caloriesFromFat = targetFat * 9;

  let caloriesForCarb = targetCalories - caloriesFromProtein - caloriesFromFat;
  if (caloriesForCarb < 0) caloriesForCarb = 0;
  const targetCarb = caloriesForCarb / 4;

  state.macroSettings.targetCalories = Math.round(targetCalories);
  state.macroSettings.targetProtein = Math.round(targetProtein);
  state.macroSettings.targetFat = Math.round(targetFat);
  state.macroSettings.targetCarb = Math.round(targetCarb);
}

function renderTDEE() {
  if (state.profile.tdee > 0) {
    tdeeValueEl.textContent = `${state.profile.tdee.toLocaleString("vi-VN")} kcal`;
  } else {
    tdeeValueEl.textContent = "- kcal";
  }

  if (state.profile.targetCalories > 0) {
    targetCaloriesValueEl.textContent = `${state.profile.targetCalories.toLocaleString("vi-VN")} kcal`;
  } else {
    targetCaloriesValueEl.textContent = "- kcal";
  }

  if (state.profile.bmi > 0) {
    bmiValueEl.textContent = `${state.profile.bmi.toFixed(1)}`;
  } else {
    bmiValueEl.textContent = "-";
  }

  const modeKey = state.profile.trainingMode || "custom";
  const cfg = TRAINING_MODE_CONFIG[modeKey] || TRAINING_MODE_CONFIG.custom;
  trainingModeLabelEl.textContent = cfg.label;
}

function renderMacro() {
  const tCals = state.macroSettings.targetCalories || 0;
  const tP = state.macroSettings.targetProtein || 0;
  const tC = state.macroSettings.targetCarb || 0;
  const tF = state.macroSettings.targetFat || 0;

  const currentDayTotals = state.dailyTotals[state.currentDate] || { calories: 0, protein: 0, carb: 0, fat: 0 };
  const cals = currentDayTotals.calories;
  const p = currentDayTotals.protein;
  const c = currentDayTotals.carb;
  const f = currentDayTotals.fat;

  caloriesSummaryEl.textContent = `${Math.round(cals)} / ${Math.round(tCals)} kcal`;
  proteinSummaryEl.textContent = `${Math.round(p)} / ${Math.round(tP)} g`;
  carbSummaryEl.textContent = `${Math.round(c)} / ${Math.round(tC)} g`;
  fatSummaryEl.textContent = `${Math.round(f)} / ${Math.round(tF)} g`;

  const calPerc = tCals > 0 ? Math.min(100, (cals / tCals) * 100) : 0;
  const pPerc = tP > 0 ? Math.min(100, (p / tP) * 100) : 0;
  const cPerc = tC > 0 ? Math.min(100, (c / tC) * 100) : 0;
  const fPerc = tF > 0 ? Math.min(100, (f / tF) * 100) : 0;

  caloriesProgressEl.style.width = `${calPerc}%`;
  proteinProgressEl.style.width = `${pPerc}%`;
  carbProgressEl.style.width = `${cPerc}%`;
  fatProgressEl.style.width = `${fPerc}%`;
}

function populateFoodSelect() {
  foodSelect.innerHTML = "";
  FOOD_DATABASE.forEach((food, index) => {
    const option = document.createElement("option");
    option.value = food.id;
    option.textContent = `${food.name} (${food.baseAmount}${food.unit} ~ ${food.calories} kcal)`;
    if (index === 0) option.selected = true;
    foodSelect.appendChild(option);
  });
  updateFoodBaseInfo();
}

function updateFoodBaseInfo() {
  const food = getSelectedFood();
  if (!food) {
    foodBaseInfo.textContent = "Chọn một món ăn để xem thông tin.";
    return;
  }
  foodBaseInfo.textContent = `${food.baseAmount}${food.unit} ~ ${food.calories} kcal | P: ${food.protein}g, C: ${food.carb}g, F: ${food.fat}g`;
}

function getSelectedFood() {
  const id = foodSelect.value;
  return FOOD_DATABASE.find((f) => f.id === id);
}

foodSelect.addEventListener("change", updateFoodBaseInfo);

foodForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const food = getSelectedFood();
  if (!food) return;

  const amount = Number(foodAmountInput.value);
  if (!amount || amount <= 0) return;

  const ratio = amount / food.baseAmount;

  const calories = food.calories * ratio;
  const protein = food.protein * ratio;
  const carb = food.carb * ratio;
  const fat = food.fat * ratio;

  const entry = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    foodId: food.id,
    name: food.name,
    amount,
    calories,
    protein,
    carb,
    fat
  };

  // Add to foodEntries for the current selected date
  if (!state.foodEntries[state.currentDate]) {
    state.foodEntries[state.currentDate] = [];
  }
  state.foodEntries[state.currentDate].push(entry);
  recalcTotals();
  renderAll();
  saveState();
});

resetDayBtn.addEventListener("click", () => {
  if (!confirm(`Xóa toàn bộ món đã ăn của ngày ${formatDate(state.currentDate)}?`)) return;
  state.foodEntries[state.currentDate] = [];
  recalcTotals();
  renderAll();
  saveState();
});

resetAllBtn.addEventListener("click", () => {
  if (!confirm("Reset toàn bộ dữ liệu (thông tin, macro, món ăn)?")) return;
  state = structuredClone(defaultState);
  // Re-initialize current date and calendar view date to today after reset
  state.currentDate = getLocalISOString(new Date());
  state.calendarViewDate = getLocalISOString(new Date());
  syncInputsFromState();
  recalcTotals();
  renderAll();
  saveState();
});

// USDA API handling
saveUsdaKeyBtn.addEventListener("click", () => {
  const key = (usdaApiKeyInput.value || "").trim();
  usdaApiKey = key;
  saveUsdaKey(key);
  updateUsdaStatus();
  alert("Đã lưu USDA API key (chỉ lưu trên trình duyệt của bạn).");
});

usdaSearchBtn.addEventListener("click", async () => {
  const userQuery = (usdaSearchInput.value || "").trim();
  if (!usdaApiKey) {
    alert("Bạn cần nhập USDA API key trước.");
    return;
  }
  if (!userQuery) return;

  usdaResultsSelect.innerHTML = "";
  const loadingOption = document.createElement("option");
  loadingOption.textContent = "Đang tìm kiếm...";
  loadingOption.value = "";
  usdaResultsSelect.appendChild(loadingOption);
  addUsdaFoodBtn.disabled = true;
  usdaStatusEl.textContent = "Đang gọi API...";
  usdaStatusEl.classList.remove("ok");
  usdaStatusEl.classList.add("warn");

  try {
    const foods = await searchUsdaFoods(mapViToEnKeyword(userQuery), usdaApiKey);

    usdaLastResults = foods.map((f) => ({
      ...f,
      viName: userQuery
    }));

    usdaResultsSelect.innerHTML = "";
    if (!foods.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Không tìm thấy món phù hợp.";
      usdaResultsSelect.appendChild(opt);
      addUsdaFoodBtn.disabled = true;
    } else {
      usdaLastResults.forEach((f, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        const labelBase = f.description || "USDA food";
        opt.textContent = `${labelBase} (≈100g: ${Math.round(f.calories)} kcal, P:${Math.round(f.protein)}g C:${Math.round(f.carb)}g F:${Math.round(f.fat)}g)`;
        usdaResultsSelect.appendChild(opt);
      });
      addUsdaFoodBtn.disabled = false;
    }

    usdaStatusEl.textContent = "API sẵn sàng";
    usdaStatusEl.classList.add("ok");
    usdaStatusEl.classList.remove("warn");
  } catch (err) {
    console.error(err);
    usdaResultsSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Lỗi khi gọi API (kiểm tra key / mạng).";
    usdaResultsSelect.appendChild(opt);
    addUsdaFoodBtn.disabled = true;
    usdaStatusEl.textContent = "Lỗi API";
    usdaStatusEl.classList.remove("ok");
    usdaStatusEl.classList.add("warn");
  }
});

addUsdaFoodBtn.addEventListener("click", () => {
  const idxStr = usdaResultsSelect.value;
  if (!idxStr) return;
  const idx = Number(idxStr);
  const food = usdaLastResults[idx];
  if (!food) return;

  const id = `usda_${food.fdcId}`;
  const newFood = {
    id,
    name: food.viName || food.description,
    baseAmount: 100,
    unit: "g",
    calories: Math.round(food.calories),
    protein: Number(food.protein.toFixed(1)),
    carb: Number(food.carb.toFixed(1)),
    fat: Number(food.fat.toFixed(1))
  };

  const exists = FOOD_DATABASE.some((f) => f.id === id);
  if (!exists) {
    FOOD_DATABASE.push(newFood);
    saveCustomFoodsToStorage();
    populateFoodSelect();
    foodSelect.value = id;
    updateFoodBaseInfo();
    alert(`Đã thêm "${newFood.name}" (100g) vào danh sách thức ăn.`);
  } else {
    alert("Món này đã có trong danh sách.");
  }
});

// Manual Food handling
addManualFoodBtn.addEventListener("click", () => {
  const name = manualFoodNameInput.value.trim();
  const baseAmount = Number(manualFoodBaseAmountInput.value);
  const unit = manualFoodUnitInput.value.trim();
  const calories = Number(manualFoodCaloriesInput.value);
  const protein = Number(manualFoodProteinInput.value);
  const carb = Number(manualFoodCarbInput.value);
  const fat = Number(manualFoodFatInput.value);

  if (!name || !baseAmount || baseAmount <= 0 || !unit) {
    alert("Vui lòng nhập đầy đủ Tên món, Lượng cơ bản và Đơn vị.");
    return;
  }
  if (isNaN(calories) || isNaN(protein) || isNaN(carb) || isNaN(fat) || calories < 0 || protein < 0 || carb < 0 || fat < 0) {
    alert("Calo, Protein, Carb, Fat phải là số không âm.");
    return;
  }

  const id = `manual_${Date.now()}`;
  const newFood = {
    id,
    name,
    baseAmount,
    unit,
    calories: Math.round(calories),
    protein: Number(protein.toFixed(1)),
    carb: Number(carb.toFixed(1)),
    fat: Number(fat.toFixed(1))
  };

  const exists = FOOD_DATABASE.some((f) => f.name.toLowerCase() === name.toLowerCase() && f.baseAmount === baseAmount && f.unit === unit);
  if (!exists) {
    FOOD_DATABASE.push(newFood);
    saveCustomFoodsToStorage();
    populateFoodSelect();
    foodSelect.value = id; // Select the newly added food
    updateFoodBaseInfo();
    alert(`Đã thêm món "${newFood.name}" vào danh sách thức ăn.`);
    // Clear inputs
    manualFoodNameInput.value = "";
    manualFoodBaseAmountInput.value = "100";
    manualFoodUnitInput.value = "g";
    manualFoodCaloriesInput.value = "0";
    manualFoodProteinInput.value = "0";
    manualFoodCarbInput.value = "0";
    manualFoodFatInput.value = "0";
  } else {
    alert("Món này (với lượng và đơn vị tương tự) đã có trong danh sách.");
  }
});


// USDA helpers
async function searchUsdaFoods(query, apiKey) {
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    pageSize: "10",
    dataType: "Survey (FNDDS),SR Legacy"
  });
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }
  const data = await res.json();
  const foods = Array.isArray(data.foods) ? data.foods : [];

  return foods
    .map((food) => {
      const nutrients = food.foodNutrients || [];
      const getNutrient = (id) => {
        const n = nutrients.find((x) => x.nutrientId === id || x.nutrientNumber === String(id));
        return n ? Number(n.value) || 0 : 0;
      };

      const calories = getNutrient(1008);
      const protein = getNutrient(1003);
      const carb = getNutrient(1005);
      const fat = getNutrient(1004);

      return {
        fdcId: food.fdcId,
        description: food.description || "USDA food",
        calories,
        protein,
        carb,
        fat
      };
    })
    .filter((f) => f.calories > 0);
}

function saveUsdaKey(key) {
  try {
    if (!key) {
      localStorage.removeItem(USDA_KEY_STORAGE);
    } else {
      localStorage.setItem(USDA_KEY_STORAGE, key);
    }
  } catch (err) {
    console.error("Không thể lưu USDA key:", err);
  }
}

function loadUsdaKey() {
  try {
    return localStorage.getItem(USDA_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

function updateUsdaStatus() {
  if (usdaApiKey) {
    usdaStatusEl.textContent = "Đã cấu hình API key";
    usdaStatusEl.classList.add("ok");
    usdaStatusEl.classList.remove("warn");
  } else {
    usdaStatusEl.textContent = "Chưa cấu hình";
    usdaStatusEl.classList.remove("ok");
    usdaStatusEl.classList.add("warn");
  }
}

function saveCustomFoodsToStorage() {
  try {
    // Save both USDA and manually added custom foods
    const customs = FOOD_DATABASE.filter((f) => f.id.startsWith("usda_") || f.id.startsWith("manual_"));
    localStorage.setItem(CUSTOM_FOOD_STORAGE, JSON.stringify(customs));
  } catch (err) {
    console.error("Không thể lưu custom foods:", err);
  }
}

function loadCustomFoodsFromStorage() {
  try {
    const raw = localStorage.getItem(CUSTOM_FOOD_STORAGE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function recalcTotals() {
  const currentDayFoodEntries = state.foodEntries[state.currentDate] || [];
  const totals = {
    calories: 0,
    protein: 0,
    carb: 0,
    fat: 0
  };

  currentDayFoodEntries.forEach((e) => {
    totals.calories += e.calories;
    totals.protein += e.protein;
    totals.carb += e.carb;
    totals.fat += e.fat;
  });

  state.dailyTotals[state.currentDate] = {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carb: Math.round(totals.carb),
    fat: Math.round(totals.fat)
  };
}

function renderFoodList() {
  foodTableBody.innerHTML = "";
  const currentDayFoodEntries = state.foodEntries[state.currentDate] || [];

  if (currentDayFoodEntries.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = `Chưa có món ăn nào cho ngày ${formatDate(state.currentDate)}.`;
    td.style.textAlign = "center";
    td.style.color = "#9ca3af";
    td.style.fontSize = "0.8rem";
    td.style.padding = "10px 6px";
    tr.appendChild(td);
    foodTableBody.appendChild(tr);
    return;
  }

  currentDayFoodEntries.forEach((e) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = e.name;
    tr.appendChild(tdName);

    const tdAmount = document.createElement("td");
    tdAmount.textContent = `${Math.round(e.amount)} g`;
    tr.appendChild(tdAmount);

    const tdCal = document.createElement("td");
    tdCal.textContent = Math.round(e.calories);
    tr.appendChild(tdCal);

    const tdP = document.createElement("td");
    tdP.textContent = Math.round(e.protein);
    tr.appendChild(tdP);

    const tdC = document.createElement("td");
    tdC.textContent = Math.round(e.carb);
    tr.appendChild(tdC);

    const tdF = document.createElement("td");
    tdF.textContent = Math.round(e.fat);
    tr.appendChild(tdF);

    const tdAction = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "Xóa";
    delBtn.className = "btn btn-outline small danger";
    delBtn.addEventListener("click", () => {
      state.foodEntries[state.currentDate] = state.foodEntries[state.currentDate].filter((x) => x.id !== e.id);
      recalcTotals();
      renderAll();
      saveState();
    });
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    foodTableBody.appendChild(tr);
  });

  const currentDayTotals = state.dailyTotals[state.currentDate] || { calories: 0, protein: 0, carb: 0, fat: 0 };
  totalCaloriesEl.textContent = `${currentDayTotals.calories} kcal`;
  totalProteinEl.textContent = `${currentDayTotals.protein} g`;
  totalCarbEl.textContent = `${currentDayTotals.carb} g`;
  totalFatEl.textContent = `${currentDayTotals.fat} g`;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Không thể lưu localStorage:", err);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);

    // Migration for old state where foodEntries was an array
    if (Array.isArray(parsed.foodEntries)) {
      const today = getLocalISOString(new Date()); // Use local ISO string for migration
      parsed.foodEntries = { [today]: parsed.foodEntries };
      // Also migrate old totals if it was a single object
      if (parsed.totals && !parsed.dailyTotals) {
        parsed.dailyTotals = { [today]: parsed.totals };
      }
    }

    const loadedState = {
      profile: { ...defaultState.profile, ...(parsed.profile || {}) },
      macroSettings: { ...defaultState.macroSettings, ...(parsed.macroSettings || {}) },
      foodEntries: parsed.foodEntries || {},
      dailyTotals: parsed.dailyTotals || {},
      dailyWeight: parsed.dailyWeight || {}, // Load dailyWeight
      currentDate: parsed.currentDate || defaultState.currentDate,
      calendarViewDate: parsed.calendarViewDate || defaultState.calendarViewDate,
      collapseStates: { ...defaultState.collapseStates, ...(parsed.collapseStates || {}) }, // Load collapse states
      geminiApiKey: parsed.geminiApiKey || "", // New: Load Gemini API key
      chatHistory: parsed.chatHistory || [] // New: Load chat history
    };

    return loadedState;
  } catch {
    return structuredClone(defaultState);
  }
}

function syncInputsFromState() {
  genderInput.value = state.profile.gender;
  genderButtons.forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-gender") === state.profile.gender);
  });

  ageInput.value = state.profile.age;
  heightInput.value = state.profile.height;
  weightInput.value = state.profile.weight;
  activitySelect.value = String(state.profile.activity);
  
  // Set training mode and related inputs
  trainingModeSelect.value = state.profile.trainingMode || "custom";
  
  // Always set goalSelect value from the stored state.profile.goalDelta
  // The change listener for trainingModeSelect will update state.profile.goalDelta
  // if a predefined mode is selected, and the goalSelect change listener handles manual changes.
  goalSelect.value = String(state.profile.goalDelta);

  // The currentModeCfg is still useful for setting protein/fat per kg if not custom
  const currentModeCfg = TRAINING_MODE_CONFIG[state.profile.trainingMode] || TRAINING_MODE_CONFIG.custom;

  if (currentModeCfg.proteinPerKg !== undefined) {
    proteinPerKgInput.value = currentModeCfg.proteinPerKg;
    fatPerKgInput.value = currentModeCfg.fatPerKg;
  } else {
    proteinPerKgInput.value = state.macroSettings.proteinPerKg;
    fatPerKgInput.value = state.macroSettings.fatPerKg;
  }

  usdaApiKeyInput.value = usdaApiKey;
  updateUsdaStatus();

  geminiApiKeyInput.value = geminiApiKey; // New: Sync Gemini API key input
  updateGeminiStatus(); // New: Update Gemini status
}

function renderTotalsSummaryOnly() {
  const currentDayTotals = state.dailyTotals[state.currentDate] || { calories: 0, protein: 0, carb: 0, fat: 0 };
  totalCaloriesEl.textContent = `${currentDayTotals.calories} kcal`;
  totalProteinEl.textContent = `${currentDayTotals.protein} g`;
  totalCarbEl.textContent = `${currentDayTotals.carb} g`;
  totalFatEl.textContent = `${currentDayTotals.fat} g`;
}

// Render daily nutrition and weight bar chart
function renderDailyChart() {
  dailyChartContainer.innerHTML = "";

  const datesWithData = Object.keys(state.dailyTotals).filter(date => {
    const dayData = state.dailyTotals[date];
    return dayData && dayData.calories > 0;
  }).sort();
  
  const allDatesWithWeight = Object.keys(state.dailyWeight).filter(date => state.dailyWeight[date] !== undefined).sort();

  const allDatesInChartSet = new Set([...datesWithData, ...allDatesWithWeight]);
  const sortedAllDates = Array.from(allDatesInChartSet).sort();
  const last7AllDates = sortedAllDates.slice(Math.max(0, sortedAllDates.length - 7));

  if (last7AllDates.length === 0) {
    dailyChartContainer.textContent = "Chưa có dữ liệu dinh dưỡng hoặc cân nặng hàng ngày.";
    dailyChartContainer.style.justifyContent = "center";
    dailyChartContainer.style.alignItems = "center";
    dailyChartContainer.style.color = "#9ca3af";
    return;
  }
  dailyChartContainer.style.justifyContent = "flex-start";
  dailyChartContainer.style.alignItems = "flex-end";
  dailyChartContainer.style.color = "var(--text)";

  let maxTotalMacroCals = 0;
  let maxWeight = 0;

  last7AllDates.forEach(date => {
    const dayData = state.dailyTotals[date];
    if (dayData) {
      const pCals = dayData.protein * 4;
      const cCals = dayData.carb * 4;
      const fCals = dayData.fat * 9;
      const currentDayMacroCals = pCals + cCals + fCals;
      if (currentDayMacroCals > maxTotalMacroCals) {
        maxTotalMacroCals = currentDayMacroCals;
      }
    }
    const dayWeight = state.dailyWeight[date];
    if (dayWeight && dayWeight > maxWeight) {
      maxWeight = dayWeight;
    }
  });

  if (maxTotalMacroCals === 0) maxTotalMacroCals = 1;
  if (maxWeight === 0) maxWeight = 1;

  // Create SVG element for lines
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.overflow = "visible"; // Allow lines to extend slightly if needed
  svg.style.zIndex = "2"; // Ensure SVG is below dots and text
  dailyChartContainer.appendChild(svg);

  let prevDotCenter = null; // To store {x, y, weight} of the previous dot

  // Store references to weight bars and their associated data for post-rendering calculations
  const weightBarElements = [];

  last7AllDates.forEach((date, index) => {
    const dayData = state.dailyTotals[date] || { calories: 0, protein: 0, carb: 0, fat: 0 };
    const dayWeight = state.dailyWeight[date];

    const dailyChartGroup = document.createElement("div");
    dailyChartGroup.className = "daily-chart-group";

    const barsContainer = document.createElement("div");
    barsContainer.className = "bars-container";

    // --- Nutrition Bar ---
    const proteinCals = dayData.protein * 4;
    const carbCals = dayData.carb * 4;
    const fatCals = dayData.fat * 9;
    const totalMacroCals = proteinCals + carbCals + fatCals;

    const nutritionBarWrapper = document.createElement("div");
    nutritionBarWrapper.className = "chart-bar-wrapper";

    const nutritionMainBar = document.createElement("div");
    nutritionMainBar.className = "chart-bar";
    nutritionMainBar.style.height = `${(totalMacroCals / maxTotalMacroCals) * 100}%`;

    const createSegment = (value, totalForDay, className) => {
      if (value <= 0 || totalForDay <= 0) return null;
      const segment = document.createElement("div");
      segment.className = `chart-segment ${className}`;
      segment.style.height = `${(value / totalForDay) * 100}%`;
      return segment;
    };

    const fatSegment = createSegment(fatCals, totalMacroCals, 'fat');
    if (fatSegment) nutritionMainBar.appendChild(fatSegment);
    const carbSegment = createSegment(carbCals, totalMacroCals, 'carb');
    if (carbSegment) nutritionMainBar.appendChild(carbSegment);
    const proteinSegment = createSegment(proteinCals, totalMacroCals, 'protein');
    if (proteinSegment) nutritionMainBar.appendChild(proteinSegment);

    const nutritionValueLabel = document.createElement("span");
    nutritionValueLabel.className = "bar-value";
    nutritionValueLabel.textContent = `${Math.round(totalMacroCals)} kcal`;
    nutritionMainBar.appendChild(nutritionValueLabel);
    nutritionBarWrapper.appendChild(nutritionMainBar);
    barsContainer.appendChild(nutritionBarWrapper);

    // --- Weight Bar ---
    const weightBarWrapper = document.createElement("div");
    weightBarWrapper.className = "chart-bar-wrapper";

    const weightMainBar = document.createElement("div");
    weightMainBar.className = "chart-bar weight";
    if (dayWeight !== undefined) {
      weightMainBar.style.height = `${(dayWeight / maxWeight) * 100}%`;
    } else {
      weightMainBar.style.height = `0%`; // No weight data
    }

    const weightValueLabel = document.createElement("span");
    weightValueLabel.className = "bar-value";
    weightValueLabel.textContent = dayWeight !== undefined ? `${dayWeight} kg` : '-';
    weightMainBar.appendChild(weightValueLabel);
    weightBarWrapper.appendChild(weightMainBar);
    barsContainer.appendChild(weightBarWrapper);

    // --- Red Dot on Weight Bar ---
    if (dayWeight !== undefined) {
      const weightDot = document.createElement("div");
      weightDot.className = "weight-dot";
      weightMainBar.appendChild(weightDot); // Append to the bar itself
    }

    // Store reference to the weight bar for later position calculation
    weightBarElements.push({ element: weightMainBar, weight: dayWeight, date: date });

    // --- Date Label ---
    const dateLabel = document.createElement("span");
    dateLabel.className = "bar-date";
    dateLabel.textContent = parseLocalISOString(date).toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric' });
    
    dailyChartGroup.appendChild(barsContainer);
    dailyChartGroup.appendChild(dateLabel);
    dailyChartContainer.appendChild(dailyChartGroup);
  });

  // --- Draw lines and difference labels after all bars are in DOM ---
  const containerRect = dailyChartContainer.getBoundingClientRect();

  weightBarElements.forEach((barInfo, index) => {
    if (barInfo.weight === undefined) {
      prevDotCenter = null; // Reset if there's a gap in weight data
      return;
    }

    const barRect = barInfo.element.getBoundingClientRect();
    
    // Calculate the center of the dot relative to the dailyChartContainer
    // The dot is 8px high, positioned -4px from the top of the bar.
    // This means the center of the dot is at the top edge of the bar.
    const dotX = (barRect.left + barRect.right) / 2 - containerRect.left;
    const dotY = barRect.top - containerRect.top; // Top of the bar, which is the center of the dot

    const currentDotCenter = { x: dotX, y: dotY, weight: barInfo.weight };

    if (prevDotCenter && prevDotCenter.weight !== undefined && currentDotCenter.weight !== undefined) {
      // Draw SVG line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", prevDotCenter.x);
      line.setAttribute("y1", prevDotCenter.y);
      line.setAttribute("x2", currentDotCenter.x);
      line.setAttribute("y2", currentDotCenter.y);
      line.setAttribute("stroke", "var(--danger)");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);

      // Add difference text
      const diff = currentDotCenter.weight - prevDotCenter.weight;
      const diffText = document.createElement("span");
      diffText.className = "weight-diff";
      diffText.textContent = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
      diffText.classList.add(diff > 0 ? 'diff-increase' : 'diff-decrease');

      // Position difference text at the midpoint of the line
      const midX = (prevDotCenter.x + currentDotCenter.x) / 2;
      const midY = (prevDotCenter.y + currentDotCenter.y) / 2;
      
      diffText.style.left = `${midX}px`;
      diffText.style.top = `${midY}px`; // Position at midpoint
      diffText.style.transform = `translate(-50%, -50%)`; // Center text both horizontally and vertically
      dailyChartContainer.appendChild(diffText);
    }
    prevDotCenter = currentDotCenter;
  });
}

// Render daily weight input and display
function renderDailyWeightInput() {
  const currentWeight = state.dailyWeight[state.currentDate];
  if (currentWeight !== undefined) {
    dailyWeightInput.value = currentWeight;
    currentDailyWeightDisplay.textContent = `Cân nặng hôm nay: ${currentWeight} kg`;
  } else {
    dailyWeightInput.value = "";
    currentDailyWeightDisplay.textContent = "Cân nặng hôm nay: - kg";
  }
}

// Event listener for saving daily weight
saveDailyWeightBtn.addEventListener("click", () => {
  const weight = Number(dailyWeightInput.value);
  if (isNaN(weight) || weight <= 0) {
    alert("Vui lòng nhập cân nặng hợp lệ (số dương).");
    return;
  }
  state.dailyWeight[state.currentDate] = weight;
  saveState();
  renderAll(); // Re-render to update display
  alert(`Đã lưu cân nặng ${weight} kg cho ngày ${formatDate(state.currentDate)}.`);
});

// New: Function to export data to CSV
function exportDataToCsv() {
  let csvContent = "";

  // Helper to escape CSV values
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    let stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // 1. Profile Data
  csvContent += "Thông tin cá nhân\n";
  csvContent += `Giới tính,${escapeCsv(state.profile.gender === 'male' ? 'Nam' : 'Nữ')}\n`;
  csvContent += `Tuổi,${escapeCsv(state.profile.age)}\n`;
  csvContent += `Chiều cao (cm),${escapeCsv(state.profile.height)}\n`;
  csvContent += `Cân nặng ban đầu (kg),${escapeCsv(state.profile.weight)}\n`;
  csvContent += `Mức độ vận động,${escapeCsv(activitySelect.options[activitySelect.selectedIndex].text)}\n`;
  csvContent += `Chế độ luyện tập,${escapeCsv(TRAINING_MODE_CONFIG[state.profile.trainingMode]?.label || state.profile.trainingMode)}\n`;
  csvContent += `Mục tiêu Calo Delta,${escapeCsv(state.profile.goalDelta)} kcal\n`;
  csvContent += `TDEE (duy trì),${escapeCsv(state.profile.tdee)} kcal\n`;
  csvContent += `Calo mục tiêu,${escapeCsv(state.profile.targetCalories)} kcal\n`;
  csvContent += `BMI,${escapeCsv(state.profile.bmi.toFixed(1))}\n`;
  csvContent += "\n";

  // 2. Macro Settings
  csvContent += "Mục tiêu Macro\n";
  csvContent += `Protein (g/kg),${escapeCsv(state.macroSettings.proteinPerKg)}\n`;
  csvContent += `Fat (g/kg),${escapeCsv(state.macroSettings.fatPerKg)}\n`;
  csvContent += `Mục tiêu Protein (g),${escapeCsv(state.macroSettings.targetProtein)}\n`;
  csvContent += `Mục tiêu Carb (g),${escapeCsv(state.macroSettings.targetCarb)}\n`;
  csvContent += `Mục tiêu Fat (g),${escapeCsv(state.macroSettings.targetFat)}\n`;
  csvContent += "\n";

  // 3. Daily Summary (Date, Total Calories, Total Protein, Total Carb, Total Fat, Daily Weight)
  csvContent += "Tổng quan hàng ngày\n";
  csvContent += "Ngày,Tổng Calo (kcal),Tổng Protein (g),Tổng Carb (g),Tổng Fat (g),Cân nặng (kg)\n";
  const sortedDates = Object.keys(state.dailyTotals).sort();
  sortedDates.forEach(date => {
    const totals = state.dailyTotals[date] || { calories: 0, protein: 0, carb: 0, fat: 0 };
    const weight = state.dailyWeight[date] !== undefined ? state.dailyWeight[date] : '-';
    csvContent += `${escapeCsv(formatDate(date))},${escapeCsv(totals.calories)},${escapeCsv(totals.protein)},${escapeCsv(totals.carb)},${escapeCsv(totals.fat)},${escapeCsv(weight)}\n`;
  });
  csvContent += "\n";

  // 4. Detailed Food Entries
  csvContent += "Chi tiết món ăn đã ăn\n";
  csvContent += "Ngày,Tên món,Lượng (g),Calo (kcal),Protein (g),Carb (g),Fat (g)\n";
  sortedDates.forEach(date => {
    const entries = state.foodEntries[date] || [];
    if (entries.length > 0) {
      entries.forEach(entry => {
        csvContent += `${escapeCsv(formatDate(date))},${escapeCsv(entry.name)},${escapeCsv(entry.amount)},${escapeCsv(Math.round(entry.calories))},${escapeCsv(Math.round(entry.protein))},${escapeCsv(Math.round(entry.carb))},${escapeCsv(Math.round(entry.fat))}\n`;
      });
    } else {
      csvContent += `${escapeCsv(formatDate(date))},Không có món ăn nào,,,,,\n`;
    }
  });
  csvContent += "\n";

  // 5. Custom Food Database
  csvContent += "Danh sách món ăn tùy chỉnh\n";
  csvContent += "ID,Tên món,Lượng cơ bản (g),Đơn vị,Calo (kcal),Protein (g),Carb (g),Fat (g)\n";
  const customFoods = FOOD_DATABASE.filter((f) => f.id.startsWith("usda_") || f.id.startsWith("manual_"));
  customFoods.forEach(food => {
    csvContent += `${escapeCsv(food.id)},${escapeCsv(food.name)},${escapeCsv(food.baseAmount)},${escapeCsv(food.unit)},${escapeCsv(food.calories)},${escapeCsv(food.protein)},${escapeCsv(food.carb)},${escapeCsv(food.fat)}\n`;
  });

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tdee_tracker_data_${getLocalISOString(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Dữ liệu đã được xuất ra file CSV!");
  } else {
    alert("Trình duyệt của bạn không hỗ trợ tải file trực tiếp. Vui lòng sao chép nội dung CSV thủ công.");
    console.log(csvContent); // Log to console for manual copy
  }
}

// Event listener for export CSV button
exportCsvBtn.addEventListener("click", exportDataToCsv);


// Calendar functions
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

function renderCalendar() {
  calendarDaysGrid.innerHTML = "";
  const viewDate = new Date(state.calendarViewDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  currentMonthYearEl.textContent = `${MONTH_NAMES[month]} ${year}`;
  selectedDateDisplayEl.textContent = `(${formatDate(state.currentDate)})`;

  // Get the first day of the month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // We want Monday to be the first day of the week, so adjust
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday
  if (startingDay === 0) startingDay = 7; // Treat Sunday as 7th day for Monday-first week
  startingDay = startingDay - 1; // Adjust to 0-indexed for Monday

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayISO = getLocalISOString(new Date()); // Use local ISO string for today's date

  // Add days from previous month
  for (let i = startingDay; i > 0; i--) {
    const day = daysInPrevMonth - i + 1;
    const prevMonthDate = new Date(year, month - 1, day);
    const dayEl = createCalendarDayElement(prevMonthDate, true);
    calendarDaysGrid.appendChild(dayEl);
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDayDate = new Date(year, month, i);
    const dayISO = getLocalISOString(currentDayDate); // Use local ISO string
    const isToday = dayISO === todayISO;
    const isSelected = dayISO === state.currentDate;
    const hasData = !!state.dailyTotals[dayISO] && state.dailyTotals[dayISO].calories > 0;

    const dayEl = createCalendarDayElement(currentDayDate, false, isToday, isSelected, hasData);
    calendarDaysGrid.appendChild(dayEl);
  }

  // Add days from next month (to fill the grid)
  const totalDaysRendered = startingDay + daysInMonth;
  const remainingCells = 42 - totalDaysRendered; // Max 6 rows * 7 days = 42 cells
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const dayEl = createCalendarDayElement(nextMonthDate, true);
    calendarDaysGrid.appendChild(dayEl);
  }
}

function createCalendarDayElement(date, isOtherMonth, isToday = false, isSelected = false, hasData = false) {
  const dayEl = document.createElement("div");
  dayEl.className = "calendar-day";
  dayEl.textContent = date.getDate();

  if (isOtherMonth) {
    dayEl.classList.add("other-month");
  } else {
    dayEl.setAttribute("data-date", getLocalISOString(date)); // Use local ISO string
    if (isToday) dayEl.classList.add("today");
    if (isSelected) dayEl.classList.add("selected");
    if (hasData) dayEl.classList.add("has-data");
    dayEl.addEventListener("click", () => selectDate(getLocalISOString(date))); // Use local ISO string
  }
  return dayEl;
}

function changeMonth(delta) {
  const currentViewDate = new Date(state.calendarViewDate);
  currentViewDate.setMonth(currentViewDate.getMonth() + delta);
  state.calendarViewDate = getLocalISOString(currentViewDate); // Use local ISO string
  saveState();
  renderCalendar();
}

function selectDate(dateString) {
  state.currentDate = dateString;
  // Ensure calendar view is on the selected date's month
  const selectedDateObj = parseLocalISOString(dateString); // Use parseLocalISOString
  const calendarViewDateObj = parseLocalISOString(state.calendarViewDate); // Use parseLocalISOString
  if (selectedDateObj.getMonth() !== calendarViewDateObj.getMonth() || selectedDateObj.getFullYear() !== calendarViewDateObj.getFullYear()) {
    state.calendarViewDate = dateString;
  }
  recalcTotals(); // Recalculate totals for the newly selected day
  renderAll();
  saveState();
}

prevMonthBtn.addEventListener("click", () => changeMonth(-1));
nextMonthBtn.addEventListener("click", () => changeMonth(1));

function formatDate(dateString) {
  const date = parseLocalISOString(dateString); // Use parseLocalISOString
  return date.toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric', year: 'numeric' });
}

// New: Function to toggle collapse state
function toggleCollapse(button, targetId) {
  const contentEl = document.getElementById(targetId);
  if (contentEl) {
    const isCollapsed = contentEl.classList.toggle('collapsed');
    button.classList.toggle('rotated', isCollapsed);
    state.collapseStates[targetId] = isCollapsed; // Save state
    saveState();
  }
}

// New: Gemini Chatbot functions
function loadGeminiKey() {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

function saveGeminiKey(key) {
  try {
    if (!key) {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    } else {
      localStorage.setItem(GEMINI_KEY_STORAGE, key);
    }
  } catch (err) {
    console.error("Không thể lưu Gemini key:", err);
  }
}

function updateGeminiStatus() {
  if (geminiApiKey) {
    geminiStatusEl.textContent = "Đã cấu hình API key";
    geminiStatusEl.classList.add("ok");
    geminiStatusEl.classList.remove("warn");
  } else {
    geminiStatusEl.textContent = "Chưa cấu hình";
    geminiStatusEl.classList.remove("ok");
    geminiStatusEl.classList.add("warn");
  }
}

function renderChatHistory() {
  chatMessagesEl.innerHTML = "";
  state.chatHistory.forEach(msg => {
    const msgEl = document.createElement("div");
    
    // Xử lý class CSS (giữ nguyên logic sửa lỗi role 'bot' vs 'model' ở câu trả lời trước)
    const cssClass = msg.role === 'model' ? 'bot' : msg.role; 
    msgEl.className = `chat-message ${cssClass}`;
    
    // --- PHẦN SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY ---
    
    // 1. Lấy nội dung text thô từ Gemini
    const rawText = msg.parts.map(p => p.text).join('');
    
    // 2. Dùng thư viện marked để chuyển đổi sang HTML (nó sẽ tự tạo thẻ <p>, <ul>, <li>, <strong>...)
    // marked.parse() sẽ trả về chuỗi HTML đã được format đẹp
    msgEl.innerHTML = marked.parse(rawText); 
    
    // ----------------------------------------

    chatMessagesEl.appendChild(msgEl);
  });
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; // Scroll to bottom
}

function getDailyDataForChat() {
  const dailyTotals = state.dailyTotals[state.currentDate] || { calories: 0, protein: 0, carb: 0, fat: 0 };
  const dailyWeight = state.dailyWeight[state.currentDate];
  
  // Lấy thêm mục tiêu (Target)
  const targets = state.macroSettings; 

  let dataString = `Dữ liệu dinh dưỡng ngày ${formatDate(state.currentDate)}:\n`;
  
  // Thông tin Calo
  dataString += `- Calo: Đã ăn ${dailyTotals.calories} / Mục tiêu ${targets.targetCalories} kcal.\n`;
  
  // Thông tin Macro
  dataString += `- Protein: ${dailyTotals.protein}g / ${targets.targetProtein}g.\n`;
  dataString += `- Carb: ${dailyTotals.carb}g / ${targets.targetCarb}g.\n`;
  dataString += `- Fat: ${dailyTotals.fat}g / ${targets.targetFat}g.\n`;

  // Thông tin cân nặng
  if (dailyWeight !== undefined) {
    dataString += `- Cân nặng ghi nhận hôm nay: ${dailyWeight} kg.\n`;
  } else {
    dataString += `- Chưa ghi nhận cân nặng hôm nay.\n`;
  }
  
  return dataString;
}

async function sendMessageToGemini(userMessage) {
  if (!geminiApiKey) {
    alert("Vui lòng nhập Gemini API key trước.");
    return;
  }
  if (!userMessage.trim()) return;

  // 1. Hiển thị tin nhắn người dùng lên giao diện ngay lập tức
  state.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
  renderChatHistory();
  chatInputEl.value = ""; // Xóa ô nhập

  // 2. Hiển thị tin nhắn "Đang suy nghĩ..."
  const loadingMessage = { role: "model", parts: [{ text: "Đang suy nghĩ..." }] };
  state.chatHistory.push(loadingMessage);
  renderChatHistory();

  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    // --- PHẦN QUAN TRỌNG NHẤT: TẠO BỐI CẢNH (CONTEXT) ---
    
    // Lấy dữ liệu mới nhất ngay tại thời điểm bấm nút gửi
    const currentNutritionData = getDailyDataForChat();

    // Tạo System Prompt (Lời nhắc hệ thống)
    // Đây là "bộ não" hướng dẫn bot cách cư xử và cung cấp số liệu
    const systemInstruction = {
      "role": "user", // Gemini API qua REST dùng role 'user' cho system prompt ở lượt đầu
      "parts": [{
        "text": `
          Bạn là một chuyên gia dinh dưỡng cá nhân (PT) thân thiện và nghiêm khắc khi cần.
          
          DỮ LIỆU CỦA TÔI HÔM NAY (${formatDate(state.currentDate)}):
          ${currentNutritionData}
          
          NHIỆM VỤ CỦA BẠN:
          1. Trả lời câu hỏi dựa trên số liệu trên.
          2. Nếu tôi hỏi "tôi nên ăn gì nữa", hãy tính toán lượng macro còn thiếu (Mục tiêu - Đã ăn) và gợi ý món ăn cụ thể.
          3. Đưa ra lời khuyên ngắn gọn, súc tích.
        `
      }]
    };

    // Ghép System Prompt + Lịch sử chat cũ + Tin nhắn mới nhất
    // Lưu ý: state.chatHistory đã bao gồm tin nhắn mới của user ở bước 1, 
    // nhưng chưa bao gồm loadingMessage (vì chúng ta không gửi loading lên server).
    // Chúng ta lấy lịch sử trừ đi cái loadingMessage cuối cùng.
    const historyToSend = state.chatHistory.slice(0, -1); 
    
    // Tuy nhiên, để tránh lỗi role (User phải nói trước Model), và để System Prompt luôn mới nhất,
    // Ta không dùng historyToSend trực tiếp mà sẽ lọc bỏ System Prompt cũ (nếu có) và chèn cái mới vào đầu.
    
    // Lọc lấy các tin nhắn trao đổi thực tế (bỏ qua các system prompt cũ nếu bạn từng lưu vào state)
    // Ở code hiện tại của bạn, system prompt không được lưu vào state.chatHistory nên ta chỉ cần ghép vào đầu.
    
    // Loại bỏ tin nhắn user mới nhất ra khỏi history để ghép vào cuối cùng (cho đúng chuẩn luồng)
    const pastHistory = historyToSend.slice(0, -1);
    const lastUserMessage = historyToSend[historyToSend.length - 1];

    const conversation = [
      systemInstruction,  // Luôn luôn là phần tử đầu tiên với dữ liệu MỚI NHẤT
      ...pastHistory,     // Lịch sử trò chuyện cũ
      lastUserMessage     // Câu hỏi hiện tại
    ];

    // -----------------------------------------------------

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: conversation }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.candidates[0]?.content?.parts[0]?.text || "Xin lỗi, tôi không thể tạo phản hồi lúc này.";

    // Xóa tin nhắn loading và thêm phản hồi thật
    state.chatHistory.pop(); 
    state.chatHistory.push({ role: "model", parts: [{ text: botResponse }] });
    
    saveState();
    renderChatHistory();

  } catch (error) {
    console.error("Lỗi:", error);
    state.chatHistory.pop();
    state.chatHistory.push({ role: "model", parts: [{ text: `Lỗi: ${error.message}` }] });
    saveState();
    renderChatHistory();
  }
}

saveGeminiKeyBtn.addEventListener("click", () => {
  const key = (geminiApiKeyInput.value || "").trim();
  geminiApiKey = key;
  saveGeminiKey(key);
  updateGeminiStatus();
  alert("Đã lưu Gemini API key (chỉ lưu trên trình duyệt của bạn).");
});

sendChatBtn.addEventListener("click", () => {
  sendMessageToGemini(chatInputEl.value);
});

chatInputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessageToGemini(chatInputEl.value);
  }
});

// New: Event listener for Refresh Chat button
refreshChatBtn.addEventListener("click", () => {
  if (confirm("Bạn có chắc chắn muốn làm mới lịch sử trò chuyện?")) {
    state.chatHistory = []; // Clear chat history
    saveState(); // Save the cleared state
    renderChatHistory(); // Re-render to show empty chat
    chatInputEl.value = ""; // Clear input field
  }
});


function renderAll() {
  renderTDEE();
  renderMacro();
  renderFoodList();
  renderDailyChart(); // Render the daily bar chart
  renderDailyWeightInput(); // Render the daily weight input
  renderCalendar(); // Re-render calendar to update selected day highlight
  renderChatHistory(); // New: Render chat history
}

(function init() {
  const today = getLocalISOString(new Date()); // Use local ISO string for today's date

  // Load custom foods first
  const customFoods = loadCustomFoodsFromStorage();
  if (customFoods.length) {
    const existingIds = new Set(FOOD_DATABASE.map((f) => f.id));
    customFoods.forEach((cf) => {
      if (!existingIds.has(cf.id)) FOOD_DATABASE.push(cf);
    });
  }

  // Handle new day logic for current date
  if (state.currentDate && state.currentDate !== today) {
    // It's a new day, ensure previous day's totals are saved
    // This is handled by recalcTotals() when food is added, but ensure it's there if no food was added
    if (!state.dailyTotals[state.currentDate]) {
      state.dailyTotals[state.currentDate] = { calories: 0, protein: 0, carb: 0, fat: 0 };
    }
    // Set current date to today, but don't clear foodEntries for today automatically
    // The user will see an empty list for today until they add food.
    state.currentDate = today;
    state.calendarViewDate = today; // Also reset calendar view to today's month
    // Clear chat history on new day to avoid stale data context
    state.chatHistory = defaultState.chatHistory;
    saveState(); // Save the state with updated dailyTotals and new current date
  } else if (!state.currentDate) {
    // First time load or old state without currentDate
    state.currentDate = today;
    state.calendarViewDate = today;
    saveState();
  }

  if (!state.profile.tdee || !state.profile.targetCalories) {
    updateProfileFromInputs();
    calculateTDEEAndUpdateState();
    applyMacroFromPerKg();
  }
  recalcTotals(); // Recalculate totals for the current day and update dailyTotals[today]
  syncInputsFromState();
  populateFoodSelect();
  
  // Apply collapse states and add event listeners for collapse buttons
  document.querySelectorAll('.collapse-btn').forEach(button => {
    const targetId = button.dataset.targetId;
    const contentEl = document.getElementById(targetId);
    if (contentEl) {
      const isCollapsed = state.collapseStates[targetId];
      if (isCollapsed) {
        contentEl.classList.add('collapsed');
        button.classList.add('rotated');
      } else {
        contentEl.classList.remove('collapsed');
        button.classList.remove('rotated');
      }
    }
    button.addEventListener('click', () => toggleCollapse(button, targetId));
  });

  renderAll();
  renderTotalsSummaryOnly();
})();