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

export type AnnouncementPhase =
  | "countdown" // Normal countdown (Saturday to Friday 12:59 PM)
  | "waiting_official" // Friday 1:00 PM AST while government resolution is pending
  | "effective_tonight"; // Friday afternoon/evening once newly announced, before Saturday 00:00 AST

export function getDominicanNow(referenceDate: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  hours: number;
  minutes: number;
  isoDate: string;
} {
  const utc = referenceDate.getTime() + referenceDate.getTimezoneOffset() * 60000;
  const domDate = new Date(utc + 3600000 * AST_OFFSET_HOURS);
  const year = domDate.getFullYear();
  const month = domDate.getMonth() + 1;
  const day = domDate.getDate();
  const dayOfWeek = domDate.getDay();
  const hours = domDate.getHours();
  const minutes = domDate.getMinutes();
  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month, day, dayOfWeek, hours, minutes, isoDate };
}

export function getAnnouncementLifecycle(
  announcementDateStr: string,
  targetDate: Date,
  currentDate: Date = new Date()
): {
  phase: AnnouncementPhase;
  timeLeft: TimeUntilAnnouncement;
  isFriday: boolean;
  hoursUntilMidnight: number;
} {
  const domNow = getDominicanNow(currentDate);
  const isFriday = domNow.dayOfWeek === 5;
  const timeLeft = getTimeUntilAnnouncement(targetDate, currentDate);

  if (isFriday) {
    if (domNow.hours >= 13) {
      if (announcementDateStr === domNow.isoDate) {
        return {
          phase: "effective_tonight",
          timeLeft,
          isFriday,
          hoursUntilMidnight: 24 - domNow.hours,
        };
      }
      return {
        phase: "waiting_official",
        timeLeft,
        isFriday,
        hoursUntilMidnight: 24 - domNow.hours,
      };
    }
  }

  return {
    phase: "countdown",
    timeLeft,
    isFriday,
    hoursUntilMidnight: 0,
  };
}

