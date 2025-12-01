import { FOOD_DATABASE, TRAINING_MODE_CONFIG } from './constants.js';
import { state, saveState, defaultState, loadCustomFoodsFromStorage, saveCustomFoodsToStorage } from './state.js';
import { mapViToEnKeyword, searchUsdaFoods, sendMessageToGemini } from './api.js';
import { initCalendar, changeMonth, selectDate } from './calendar.js';
import { renderAll, populateFoodSelect, updateFoodBaseInfo, toggleCollapse, updateUsdaStatus, updateGeminiStatus, renderChatHistory } from './ui.js';
import { getLocalISOString, formatDate } from './utils.js';

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
const proteinPerKgInput = document.getElementById("proteinPerKg");
const fatPerKgInput = document.getElementById("fatPerKg");
const applyMacroBtn = document.getElementById("applyMacroBtn");
const foodSelect = document.getElementById("foodSelect");
const foodAmountInput = document.getElementById("foodAmount");
const foodForm = document.getElementById("foodForm");
const resetDayBtn = document.getElementById("resetDayBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const usdaApiKeyInput = document.getElementById("usdaApiKey");
const saveUsdaKeyBtn = document.getElementById("saveUsdaKeyBtn");
const usdaSearchInput = document.getElementById("usdaSearch");
const usdaSearchBtn = document.getElementById("usdaSearchBtn");
const usdaResultsSelect = document.getElementById("usdaResults");
const addUsdaFoodBtn = document.getElementById("addUsdaFoodBtn");
const manualFoodNameInput = document.getElementById("manualFoodName");
const manualFoodBaseAmountInput = document.getElementById("manualFoodBaseAmount");
const manualFoodUnitInput = document.getElementById("manualFoodUnit");
const manualFoodCaloriesInput = document.getElementById("manualFoodCalories");
const manualFoodProteinInput = document.getElementById("manualFoodProtein");
const manualFoodCarbInput = document.getElementById("manualFoodCarb");
const manualFoodFatInput = document.getElementById("manualFoodFat");
const addManualFoodBtn = document.getElementById("addManualFoodBtn");
const dailyWeightInput = document.getElementById("dailyWeightInput");
const saveDailyWeightBtn = document.getElementById("saveDailyWeightBtn");
const geminiApiKeyInput = document.getElementById("geminiApiKey");
const saveGeminiKeyBtn = document.getElementById("saveGeminiKeyBtn");
const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const refreshChatBtn = document.getElementById("refreshChatBtn");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

let usdaApiKey = "";
let geminiApiKey = "";
let usdaLastResults = [];

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

function syncInputsFromState() {
  genderInput.value = state.profile.gender;
  genderButtons.forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-gender") === state.profile.gender);
  });

  ageInput.value = state.profile.age;
  heightInput.value = state.profile.height;
  weightInput.value = state.profile.weight;
  activitySelect.value = String(state.profile.activity);
  
  trainingModeSelect.value = state.profile.trainingMode || "custom";
  
  goalSelect.value = String(state.profile.goalDelta);

  const currentModeCfg = TRAINING_MODE_CONFIG[state.profile.trainingMode] || TRAINING_MODE_CONFIG.custom;

  if (currentModeCfg.proteinPerKg !== undefined) {
    proteinPerKgInput.value = currentModeCfg.proteinPerKg;
    fatPerKgInput.value = currentModeCfg.fatPerKg;
  } else {
    proteinPerKgInput.value = state.macroSettings.proteinPerKg;
    fatPerKgInput.value = state.macroSettings.fatPerKg;
  }

  usdaApiKeyInput.value = usdaApiKey;
  updateUsdaStatus(usdaApiKey);

  geminiApiKeyInput.value = geminiApiKey; 
  updateGeminiStatus(geminiApiKey);
}

function getSelectedFood() {
    const id = foodSelect.value;
    return FOOD_DATABASE.find((f) => f.id === id);
}

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

trainingModeSelect.addEventListener("change", () => {
  const mode = trainingModeSelect.value;
  state.profile.trainingMode = mode;

  const cfg = TRAINING_MODE_CONFIG[mode] || TRAINING_MODE_CONFIG.custom;

  if (cfg.goalDelta !== null) {
    goalSelect.value = String(cfg.goalDelta);
    state.profile.goalDelta = cfg.goalDelta;
  } else {
    state.profile.goalDelta = Number(goalSelect.value) || defaultState.profile.goalDelta;
  }

  if (cfg.proteinPerKg !== undefined) {
    proteinPerKgInput.value = cfg.proteinPerKg;
    fatPerKgInput.value = cfg.fatPerKg;
  } else {
    proteinPerKgInput.value = state.macroSettings.proteinPerKg;
    fatPerKgInput.value = state.macroSettings.fatPerKg;
  }

  saveState();
  calculateTDEEAndUpdateState();
  applyMacroFromPerKg(); 
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
  state.currentDate = getLocalISOString(new Date());
  state.calendarViewDate = getLocalISOString(new Date());
  syncInputsFromState();
  recalcTotals();
  renderAll();
  saveState();
});

saveUsdaKeyBtn.addEventListener("click", () => {
  const key = (usdaApiKeyInput.value || "").trim();
  usdaApiKey = key;
  localStorage.setItem('tdee_usda_api_key_v1', usdaApiKey);
  updateUsdaStatus(usdaApiKey);
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

  } catch (err) {
    console.error(err);
    usdaResultsSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Lỗi khi gọi API (kiểm tra key / mạng).";
    usdaResultsSelect.appendChild(opt);
    addUsdaFoodBtn.disabled = true;
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
    foodSelect.value = id; 
    updateFoodBaseInfo();
    alert(`Đã thêm món "${newFood.name}" vào danh sách thức ăn.`);
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

saveDailyWeightBtn.addEventListener("click", () => {
  const weight = Number(dailyWeightInput.value);
  if (isNaN(weight) || weight <= 0) {
    alert("Vui lòng nhập cân nặng hợp lệ (số dương).");
    return;
  }
  state.dailyWeight[state.currentDate] = weight;
  saveState();
  renderAll(); 
  alert(`Đã lưu cân nặng ${weight} kg cho ngày ${formatDate(state.currentDate)}.`);
});

exportCsvBtn.addEventListener("click", () => {
    let csvContent = "";

  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    let stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

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

  csvContent += "Mục tiêu Macro\n";
  csvContent += `Protein (g/kg),${escapeCsv(state.macroSettings.proteinPerKg)}\n`;
  csvContent += `Fat (g/kg),${escapeCsv(state.macroSettings.fatPerKg)}\n`;
  csvContent += `Mục tiêu Protein (g),${escapeCsv(state.macroSettings.targetProtein)}\n`;
  csvContent += `Mục tiêu Carb (g),${escapeCsv(state.macroSettings.targetCarb)}\n`;
  csvContent += `Mục tiêu Fat (g),${escapeCsv(state.macroSettings.targetFat)}\n`;
  csvContent += "\n";

  csvContent += "Tổng quan hàng ngày\n";
  csvContent += "Ngày,Tổng Calo (kcal),Tổng Protein (g),Tổng Carb (g),Tổng Fat (g),Cân nặng (kg)\n";
  const sortedDates = Object.keys(state.dailyTotals).sort();
  sortedDates.forEach(date => {
    const totals = state.dailyTotals[date] || { calories: 0, protein: 0, carb: 0, fat: 0 };
    const weight = state.dailyWeight[date] !== undefined ? state.dailyWeight[date] : '-';
    csvContent += `${escapeCsv(formatDate(date))},${escapeCsv(totals.calories)},${escapeCsv(totals.protein)},${escapeCsv(totals.carb)},${escapeCsv(totals.fat)},${escapeCsv(weight)}\n`;
  });
  csvContent += "\n";

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

  csvContent += "Danh sách món ăn tùy chỉnh\n";
  csvContent += "ID,Tên món,Lượng cơ bản (g),Đơn vị,Calo (kcal),Protein (g),Carb (g),Fat (g)\n";
  const customFoods = FOOD_DATABASE.filter((f) => f.id.startsWith("usda_") || f.id.startsWith("manual_"));
  customFoods.forEach(food => {
    csvContent += `${escapeCsv(food.id)},${escapeCsv(food.name)},${escapeCsv(food.baseAmount)},${escapeCsv(food.unit)},${escapeCsv(food.calories)},${escapeCsv(food.protein)},${escapeCsv(food.carb)},${escapeCsv(food.fat)}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { 
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
    console.log(csvContent); 
  }
});

prevMonthBtn.addEventListener("click", () => changeMonth(-1));
nextMonthBtn.addEventListener("click", () => changeMonth(1));

saveGeminiKeyBtn.addEventListener("click", () => {
  const key = (geminiApiKeyInput.value || "").trim();
  geminiApiKey = key;
  localStorage.setItem('tdee_gemini_api_key_v1', geminiApiKey);
  updateGeminiStatus(geminiApiKey);
  alert("Đã lưu Gemini API key (chỉ lưu trên trình duyệt của bạn).");
});

sendChatBtn.addEventListener("click", async () => {
  const userMessage = chatInputEl.value;
  if (!geminiApiKey) {
    alert("Vui lòng nhập Gemini API key trước.");
    return;
  }
  if (!userMessage.trim()) return;

  state.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
  renderChatHistory();
  chatInputEl.value = ""; 

  const loadingMessage = { role: "model", parts: [{ text: "Đang suy nghĩ..." }] };
  state.chatHistory.push(loadingMessage);
  renderChatHistory();

  try {
    const botResponse = await sendMessageToGemini(userMessage, geminiApiKey);
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
});

chatInputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendChatBtn.click();
  }
});

refreshChatBtn.addEventListener("click", () => {
  if (confirm("Bạn có chắc chắn muốn làm mới lịch sử trò chuyện?")) {
    state.chatHistory = []; 
    saveState(); 
    renderChatHistory(); 
    chatInputEl.value = ""; 
  }
});

(function init() {
  initCalendar(recalcTotals, renderAll);

  const today = getLocalISOString(new Date());

  const customFoods = loadCustomFoodsFromStorage();
  if (customFoods.length) {
    const existingIds = new Set(FOOD_DATABASE.map((f) => f.id));
    customFoods.forEach((cf) => {
      if (!existingIds.has(cf.id)) FOOD_DATABASE.push(cf);
    });
  }

  usdaApiKey = localStorage.getItem('tdee_usda_api_key_v1') || "";
  geminiApiKey = localStorage.getItem('tdee_gemini_api_key_v1') || "";

  if (state.currentDate && state.currentDate !== today) {
    if (!state.dailyTotals[state.currentDate]) {
      state.dailyTotals[state.currentDate] = { calories: 0, protein: 0, carb: 0, fat: 0 };
    }
    state.currentDate = today;
    state.calendarViewDate = today;
    state.chatHistory = defaultState.chatHistory;
    saveState(); 
  } else if (!state.currentDate) {
    state.currentDate = today;
    state.calendarViewDate = today;
    saveState();
  }

  if (!state.profile.tdee || !state.profile.targetCalories) {
    updateProfileFromInputs();
    calculateTDEEAndUpdateState();
    applyMacroFromPerKg();
  }
  recalcTotals(); 
  syncInputsFromState();
  populateFoodSelect();
  
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
})();