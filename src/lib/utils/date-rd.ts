/**
 * Manejo de fechas y horarios oficiales de la República Dominicana (AST / UTC-4)
 * El Ministerio de Industria, Comercio y Mipymes (MICM) anuncia cada viernes
 * a la 1:00 PM (13:00 AST) los precios que regirán desde el sábado.
 */

export const AST_OFFSET_HOURS = -4; // República Dominicana no usa horario de verano (UTC-4 todo el año)

export function getNextAnnouncementDate(referenceDate: Date = new Date()): Date {
  // Obtenemos fecha actual en UTC
  const now = new Date(referenceDate);

  // Convertimos a hora local dominicana
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const domDate = new Date(utc + 3600000 * AST_OFFSET_HOURS);

  const dayOfWeek = domDate.getDay(); // 0 = Domingo, 5 = Viernes, 6 = Sábado
  const hours = domDate.getHours();
  const minutes = domDate.getMinutes();

  // Viernes objetivo:
  // Si hoy es viernes antes de la 1:00 PM (13:00), el objetivo es hoy a las 13:00.
  // Si hoy es viernes a las 13:00 o después, o sábado/domingo/lunes/etc., el próximo viernes.
  let daysToAdd = 0;
  if (dayOfWeek === 5) {
    if (hours >= 13) {
      daysToAdd = 7;
    } else {
      daysToAdd = 0;
    }
  } else if (dayOfWeek < 5) {
    daysToAdd = 5 - dayOfWeek;
  } else {
    // Sábado (6)
    daysToAdd = 6;
  }

  const nextFridayDom = new Date(domDate);
  nextFridayDom.setDate(domDate.getDate() + daysToAdd);
  nextFridayDom.setHours(13, 0, 0, 0);

  // Convertir de vuelta a tiempo absoluto UTC/Date
  const targetUtc = nextFridayDom.getTime() - 3600000 * AST_OFFSET_HOURS;
  return new Date(targetUtc);
}

export interface TimeUntilAnnouncement {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isToday: boolean;
  isPastOrImminent: boolean;
}

export function getTimeUntilAnnouncement(targetDate: Date, currentDate: Date = new Date()): TimeUntilAnnouncement {
  const diff = targetDate.getTime() - currentDate.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isToday: true,
      isPastOrImminent: true,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isToday: days === 0,
    isPastOrImminent: diff < 30 * 60 * 1000, // Menos de 30 mins
  };
}
