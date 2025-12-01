import { STORAGE_KEY, CUSTOM_FOOD_STORAGE } from "./constants.js";

import { getLocalISOString, parseLocalISOString } from "./utils.js";

export const defaultState = {
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

export let state = loadState();

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Không thể lưu localStorage:", err);
  }
}

export function saveCustomFoodsToStorage() {
  try {
    // Save both USDA and manually added custom foods
    const customs = FOOD_DATABASE.filter((f) => f.id.startsWith("usda_") || f.id.startsWith("manual_"));
    localStorage.setItem(CUSTOM_FOOD_STORAGE, JSON.stringify(customs));
  } catch (err) {
    console.error("Không thể lưu custom foods:", err);
  }
}

export function loadCustomFoodsFromStorage() {
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
