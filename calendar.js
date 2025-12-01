import { state, saveState } from './state.js';
import { getLocalISOString, parseLocalISOString, formatDate } from './utils.js';

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

export function renderCalendar() {
  calendarDaysGrid.innerHTML = "";
  const viewDate = new Date(state.calendarViewDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  currentMonthYearEl.textContent = `${MONTH_NAMES[month]} ${year}`;
  selectedDateDisplayEl.textContent = `(${formatDate(state.currentDate)})`;

  const firstDayOfMonth = new Date(year, month, 1);
  let startingDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday
  if (startingDay === 0) startingDay = 7; // Treat Sunday as 7th day for Monday-first week
  startingDay = startingDay - 1; // Adjust to 0-indexed for Monday

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayISO = getLocalISOString(new Date()); // Use local ISO string for today's date

  for (let i = startingDay; i > 0; i--) {
    const day = daysInPrevMonth - i + 1;
    const prevMonthDate = new Date(year, month - 1, day);
    const dayEl = createCalendarDayElement(prevMonthDate, true);
    calendarDaysGrid.appendChild(dayEl);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDayDate = new Date(year, month, i);
    const dayISO = getLocalISOString(currentDayDate); // Use local ISO string
    const isToday = dayISO === todayISO;
    const isSelected = dayISO === state.currentDate;
    const hasData = !!state.dailyTotals[dayISO] && state.dailyTotals[dayISO].calories > 0;

    const dayEl = createCalendarDayElement(currentDayDate, false, isToday, isSelected, hasData);
    calendarDaysGrid.appendChild(dayEl);
  }

  const totalDaysRendered = startingDay + daysInMonth;
  const remainingCells = 42 - totalDaysRendered; // Max 6 rows * 7 days = 42 cells
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const dayEl = createCalendarDayElement(nextMonthDate, true);
    calendarDaysGrid.appendChild(dayEl);
  }
}

export function changeMonth(delta) {
  const currentViewDate = new Date(state.calendarViewDate);
  currentViewDate.setMonth(currentViewDate.getMonth() + delta);
  state.calendarViewDate = getLocalISOString(currentViewDate); // Use local ISO string
  saveState();
  renderCalendar();
}

export function selectDate(dateString) {
  state.currentDate = dateString;
  const selectedDateObj = parseLocalISOString(dateString); // Use parseLocalISOString
  const calendarViewDateObj = parseLocalISOString(state.calendarViewDate); // Use parseLocalISOString
  if (selectedDateObj.getMonth() !== calendarViewDateObj.getMonth() || selectedDateObj.getFullYear() !== calendarViewDateObj.getFullYear()) {
    state.calendarViewDate = dateString;
  }
  recalcTotals(); 
  renderAll();
  saveState();
}
