// Helper function to get local YYYY-MM-DD string
export function getLocalISOString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to parse YYYY-MM-DD string into a local Date object
export function parseLocalISOString(isoString) {
  if (!isoString) return new Date();
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day); // month - 1 because Date month is 0-indexed
}

export function formatDate(dateString) {
  const date = parseLocalISOString(dateString); // Use parseLocalISOString
  return date.toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric', year: 'numeric' });
}
