import { state } from './state.js';
import { parseLocalISOString } from './utils.js';

const dailyChartContainer = document.getElementById("dailyChartContainer");

export function renderDailyChart() {
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

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.overflow = "visible"; 
  svg.style.zIndex = "2"; 
  dailyChartContainer.appendChild(svg);

  let prevDotCenter = null; 

  const weightBarElements = [];

  last7AllDates.forEach((date, index) => {
    const dayData = state.dailyTotals[date] || { calories: 0, protein: 0, carb: 0, fat: 0 };
    const dayWeight = state.dailyWeight[date];

    const dailyChartGroup = document.createElement("div");
    dailyChartGroup.className = "daily-chart-group";

    const barsContainer = document.createElement("div");
    barsContainer.className = "bars-container";

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

    const weightBarWrapper = document.createElement("div");
    weightBarWrapper.className = "chart-bar-wrapper";

    const weightMainBar = document.createElement("div");
    weightMainBar.className = "chart-bar weight";
    if (dayWeight !== undefined) {
      weightMainBar.style.height = `${(dayWeight / maxWeight) * 100}%`;
    } else {
      weightMainBar.style.height = `0%`; 
    }

    const weightValueLabel = document.createElement("span");
    weightValueLabel.className = "bar-value";
    weightValueLabel.textContent = dayWeight !== undefined ? `${dayWeight} kg` : '-';
    weightMainBar.appendChild(weightValueLabel);
    weightBarWrapper.appendChild(weightMainBar);
    barsContainer.appendChild(weightBarWrapper);

    if (dayWeight !== undefined) {
      const weightDot = document.createElement("div");
      weightDot.className = "weight-dot";
      weightMainBar.appendChild(weightDot); 
    }

    weightBarElements.push({ element: weightMainBar, weight: dayWeight, date: date });

    const dateLabel = document.createElement("span");
    dateLabel.className = "bar-date";
    dateLabel.textContent = parseLocalISOString(date).toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric' });
    
    dailyChartGroup.appendChild(barsContainer);
    dailyChartGroup.appendChild(dateLabel);
    dailyChartContainer.appendChild(dailyChartGroup);
  });

  const containerRect = dailyChartContainer.getBoundingClientRect();

  weightBarElements.forEach((barInfo, index) => {
    if (barInfo.weight === undefined) {
      prevDotCenter = null; 
      return;
    }

    const barRect = barInfo.element.getBoundingClientRect();
    
    const dotX = (barRect.left + barRect.right) / 2 - containerRect.left;
    const dotY = barRect.top - containerRect.top;

    const currentDotCenter = { x: dotX, y: dotY, weight: barInfo.weight };

    if (prevDotCenter && prevDotCenter.weight !== undefined && currentDotCenter.weight !== undefined) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", prevDotCenter.x);
      line.setAttribute("y1", prevDotCenter.y);
      line.setAttribute("x2", currentDotCenter.x);
      line.setAttribute("y2", currentDotCenter.y);
      line.setAttribute("stroke", "var(--danger)");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);

      const diff = currentDotCenter.weight - prevDotCenter.weight;
      const diffText = document.createElement("span");
      diffText.className = "weight-diff";
      diffText.textContent = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
      diffText.classList.add(diff > 0 ? 'diff-increase' : 'diff-decrease');

      const midX = (prevDotCenter.x + currentDotCenter.x) / 2;
      const midY = (prevDotCenter.y + currentDotCenter.y) / 2;
      
      diffText.style.left = `${midX}px`;
      diffText.style.top = `${midY}px`;
      diffText.style.transform = `translate(-50%, -50%)`;
      dailyChartContainer.appendChild(diffText);
    }
    prevDotCenter = currentDotCenter;
  });
}
