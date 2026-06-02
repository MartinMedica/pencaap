export function formatMatchDate(startsAt: string) {
  const [datePart, timePart = "00:00"] = startsAt.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.slice(0, 5).split(":").map(Number);
  const hour12 = hour % 12 || 12;
  const period = hour < 12 ? "a. m." : "p. m.";

  return `${day} ${monthNames[month - 1]}. ${year}, ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
