export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function statusLabel(
  status: "recruiting" | "full" | "live" | "finished",
): string {
  const map = {
    recruiting: "Набор игроков",
    full: "Мест нет",
    live: "Идёт турнир",
    finished: "Завершён",
  };
  return map[status];
}
