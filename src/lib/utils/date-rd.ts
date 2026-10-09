/**
 * Manejo de fechas y horarios oficiales de la República Dominicana (AST / UTC-4)
 * El Ministerio de Industria, Comercio y Mipymes (MICM) anuncia cada viernes
 * a la 1:00 PM (13:00 AST) los precios que regirán desde el sábado.
 */

export const AST_OFFSET_HOURS = -4; // República Dominicana no usa horario de verano (UTC-4 todo el año)
export const AST_OFFSET_MS = AST_OFFSET_HOURS * 3600 * 1000; // -14,400,000 ms

/**
 * Desglosa los componentes de fecha y hora expresados en hora dominicana (AST / UTC-4).
 * Es determinista e inmune a la zona horaria del servidor o entorno de ejecución.
 */
export function getDominicanNow(reference: Date | string = new Date()): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  hours: number;
  minutes: number;
  seconds: number;
  isoDate: string;
} {
  let refDate: Date;
  if (typeof reference === "string") {
    // Si viene en formato simple "YYYY-MM-DD", asumimos mediodía en AST para evitar desbordes UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(reference)) {
      refDate = new Date(`${reference}T12:00:00-04:00`);
    } else {
      refDate = new Date(reference);
    }
  } else {
    refDate = reference;
  }

  // Desplazamiento exacto a hora dominicana (-4 horas de UTC)
  const domDate = new Date(refDate.getTime() + AST_OFFSET_MS);

  const year = domDate.getUTCFullYear();
  const month = domDate.getUTCMonth() + 1;
  const day = domDate.getUTCDate();
  const dayOfWeek = domDate.getUTCDay(); // 0 = Domingo, 5 = Viernes, 6 = Sábado
  const hours = domDate.getUTCHours();
  const minutes = domDate.getUTCMinutes();
  const seconds = domDate.getUTCSeconds();
  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { year, month, day, dayOfWeek, hours, minutes, seconds, isoDate };
}

/**
 * Calcula la fecha y hora oficial del próximo anuncio semanal del MICM.
 * El MICM anuncia cada viernes a la 1:00 PM AST (13:00 AST).
 * En UTC, 13:00 AST equivale exactamente a las 17:00:00.000Z (13 - (-4) = 17:00 UTC).
 */
export function getNextAnnouncementDate(referenceDate: Date | string = new Date()): Date {
  const dom = getDominicanNow(referenceDate);

  let daysToAdd = 0;
  if (dom.dayOfWeek === 5) {
    // Si hoy es viernes y ya son las 13:00 AST (1:00 PM) o más tarde, el objetivo es el siguiente viernes
    if (dom.hours >= 13) {
      daysToAdd = 7;
    } else {
      daysToAdd = 0;
    }
  } else if (dom.dayOfWeek < 5) {
    daysToAdd = 5 - dom.dayOfWeek;
  } else {
    // Sábado (6)
    daysToAdd = 6;
  }

  // 13:00 AST en UTC es exactamente 17:00 UTC (13 + 4 = 17)
  const targetUtcMs = Date.UTC(dom.year, dom.month - 1, dom.day + daysToAdd, 17, 0, 0, 0);
  return new Date(targetUtcMs);
}

/**
 * Formatea una fecha en hora estándar dominicana (AST / UTC-4).
 */
export function formatDominicanDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("es-DO", {
    timeZone: "America/Santo_Domingo",
    dateStyle: "full",
    timeStyle: "short",
  });
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

