export function formatCurrency(amount: number): string {
  return `RD$ ${amount.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPriceNumber(amount: number): string {
  return amount.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDelta(change: number): string {
  if (change === 0) return "RD$ 0.00";
  const sign = change > 0 ? "+" : "";
  return `${sign}RD$ ${change.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentage(pct: number): string {
  if (pct === 0) return "0.0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatMillions(dopMillions: number): string {
  return `RD$ ${dopMillions.toLocaleString("es-DO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} millones`;
}
