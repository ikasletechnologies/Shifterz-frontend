export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatTime(date: Date | string): string {
  if (!date) return "—";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return typeof date === "string" ? date : "—";
  return dateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function calculateDuration(startTime: string, endTime: string): string {
  let start = new Date(startTime);
  if (isNaN(start.getTime())) {
    start = new Date(`2000-01-01 ${startTime}`);
  }

  let end = new Date(endTime);
  if (isNaN(end.getTime())) {
    end = new Date(`2000-01-01 ${endTime}`);
  }

  const diffMs = end.getTime() - start.getTime();
  if (isNaN(diffMs)) return "—";

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours === 0 && mins === 0) return "Just now";
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(date: Date | string): string {
  if (!date) return "—";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return typeof date === "string" ? date : "—";
  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "—";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return typeof date === "string" ? date : "—";
  return dateObj.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
