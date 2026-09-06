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

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function placementLabel(placement: number | null): string {
  if (placement === 1) return "1-е место";
  if (placement === 2) return "2-е место";
  if (placement === 3) return "3-е место";
  return "Вылет";
}

export function statusLabel(
  status: "recruiting" | "full" | "live" | "finished" | "soon",
): string {
  const map = {
    recruiting: "Набор игроков",
    full: "Мест нет",
    live: "Идёт турнир",
    finished: "Завершён",
    soon: "Скоро",
  };
  return map[status] || "Скоро";
}
