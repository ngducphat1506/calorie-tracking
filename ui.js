import { state } from './state.js';
import { TRAINING_MODE_CONFIG, FOOD_DATABASE } from './constants.js';
import { formatDate } from './utils.js';
import { renderCalendar } from './calendar.js';
import { renderDailyChart } from './chart.js';

// DOM refs
const tdeeValueEl = document.getElementById("tdeeValue");
const targetCaloriesValueEl = document.getElementById("targetCaloriesValue");
const bmiValueEl = document.getElementById("bmiValue");
const trainingModeLabelEl = document.getElementById("trainingModeLabel");
const caloriesSummaryEl = document.getElementById("caloriesSummary");
const proteinSummaryEl = document.getElementById("proteinSummary");
const carbSummaryEl = document.getElementById("carbSummary");
const fatSummaryEl = document.getElementById("fatSummary");
const caloriesProgressEl = document.getElementById("caloriesProgress");
const proteinProgressEl = document.getElementById("proteinProgress");
const carbProgressEl = document.getElementById("carbProgress");
const fatProgressEl = document.getElementById("fatProgress");
const foodSelect = document.getElementById("foodSelect");
const foodBaseInfo = document.getElementById("foodBaseInfo");
const foodTableBody = document.getElementById("foodTableBody");
const totalCaloriesEl = document.getElementById("totalCalories");
const totalProteinEl = document.getElementById("totalProtein");
const totalCarbEl = document.getElementById("totalCarb");
const totalFatEl = document.getElementById("totalFat");
const dailyWeightInput = document.getElementById("dailyWeightInput");
const currentDailyWeightDisplay = document.getElementById("currentDailyWeightDisplay");
const chatMessagesEl = document.getElementById("chatMessages");
const usdaStatusEl = document.getElementById("usdaStatus");
const geminiStatusEl = document.getElementById("geminiStatus");

export function renderTDEE() {
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

export function renderMacro() {
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

export function populateFoodSelect() {
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

export function updateFoodBaseInfo() {
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

export function renderFoodList() {
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

export function renderDailyWeightInput() {
  const currentWeight = state.dailyWeight[state.currentDate];
  if (currentWeight !== undefined) {
    dailyWeightInput.value = currentWeight;
    currentDailyWeightDisplay.textContent = `Cân nặng hôm nay: ${currentWeight} kg`;
  } else {
    dailyWeightInput.value = "";
    currentDailyWeightDisplay.textContent = "Cân nặng hôm nay: - kg";
  }
}

export function renderChatHistory() {
  chatMessagesEl.innerHTML = "";
  state.chatHistory.forEach(msg => {
    const msgEl = document.createElement("div");
    
    const cssClass = msg.role === 'model' ? 'bot' : msg.role; 
    msgEl.className = `chat-message ${cssClass}`;
    
    const rawText = msg.parts.map(p => p.text).join('');
    
    msgEl.innerHTML = marked.parse(rawText); 

    chatMessagesEl.appendChild(msgEl);
  });
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; 
}

export function renderAll() {
  renderTDEE();
  renderMacro();
  renderFoodList();
  renderDailyChart();
  renderDailyWeightInput();
  renderCalendar();
  renderChatHistory();
}

export function renderTotalsSummaryOnly() {
  const currentDayTotals = state.dailyTotals[state.currentDate] || { calories: 0, protein: 0, carb: 0, fat: 0 };
  totalCaloriesEl.textContent = `${currentDayTotals.calories} kcal`;
  totalProteinEl.textContent = `${currentDayTotals.protein} g`;
  totalCarbEl.textContent = `${currentDayTotals.carb} g`;
  totalFatEl.textContent = `${currentDayTotals.fat} g`;
}

export function updateUsdaStatus(usdaApiKey) {
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

export function updateGeminiStatus(geminiApiKey) {
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

export function toggleCollapse(button, targetId) {
  const contentEl = document.getElementById(targetId);
  if (contentEl) {
    const isCollapsed = contentEl.classList.toggle('collapsed');
    button.classList.toggle('rotated', isCollapsed);
    state.collapseStates[targetId] = isCollapsed;
    saveState();
  }
}
