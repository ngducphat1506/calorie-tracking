import { state } from './state.js';
import { VI_TO_EN_FOOD_KEYWORDS } from './constants.js';
import { formatDate } from './utils.js';

function normalizeVi(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-͠]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapViToEnKeyword(rawQuery) {
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

export async function searchUsdaFoods(query, apiKey) {
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

function getDailyDataForChat() {
  const dailyTotals = state.dailyTotals[state.currentDate] || { calories: 0, protein: 0, carb: 0, fat: 0 };
  const dailyWeight = state.dailyWeight[state.currentDate];
  
  const targets = state.macroSettings; 

  let dataString = `Dữ liệu dinh dưỡng ngày ${formatDate(state.currentDate)}:\n`;
  
  dataString += `- Calo: Đã ăn ${dailyTotals.calories} / Mục tiêu ${targets.targetCalories} kcal.\n`;
  
  dataString += `- Protein: ${dailyTotals.protein}g / ${targets.targetProtein}g.\n`;
  dataString += `- Carb: ${dailyTotals.carb}g / ${targets.targetCarb}g.\n`;
  dataString += `- Fat: ${dailyTotals.fat}g / ${targets.targetFat}g.\n`;

  if (dailyWeight !== undefined) {
    dataString += `- Cân nặng ghi nhận hôm nay: ${dailyWeight} kg.\n`;
  } else {
    dataString += `- Chưa ghi nhận cân nặng hôm nay.\n`;
  }
  
  return dataString;
}

export async function sendMessageToGemini(userMessage, geminiApiKey) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

  const currentNutritionData = getDailyDataForChat();

  const systemInstruction = {
    "role": "user",
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
  
  const historyToSend = state.chatHistory.slice(0, -1); 
  const pastHistory = historyToSend.slice(0, -1);
  const lastUserMessage = historyToSend[historyToSend.length - 1];

  const conversation = [
    systemInstruction,
    ...pastHistory,
    lastUserMessage
  ];

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
  return data.candidates[0]?.content?.parts[0]?.text || "Xin lỗi, tôi không thể tạo phản hồi lúc này.";
}
