// Sincronizador e utilitário oficial de Horário de Brasília (America/Sao_Paulo, UTC-3)

const TIMEZONE = 'America/Sao_Paulo';

let clockOffsetMs = 0;
let lastSyncAt = 0;

export async function syncBrasiliaClock(force = false): Promise<number> {
  if (!force && lastSyncAt > 0 && Date.now() - lastSyncAt < 60_000) {
    return clockOffsetMs;
  }
  try {
    const t0 = Date.now();
    const res = await fetch('/api/time', { cache: 'no-store' });
    if (!res.ok) return clockOffsetMs;
    const t1 = Date.now();
    const data = await res.json();
    if (typeof data?.epochMs === 'number') {
      const rttHalf = Math.round((t1 - t0) / 2);
      clockOffsetMs = data.epochMs - (t1 - rttHalf);
      lastSyncAt = Date.now();
    }
  } catch {
    // Offline fallback uses local clock with last known offset
  }
  return clockOffsetMs;
}

export function getBrasiliaNow(): Date {
  return new Date(Date.now() + clockOffsetMs);
}

export function getBrasiliaParts(dateInput?: Date | string | number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ymd: string;
  mesAno: string;
  hhmm: string;
  hhmmss: string;
  ddmmyyyy: string;
  formatted: string;
  iso: string;
  dayOfWeek: number;
  minutesOfDay: number;
} {
  const date =
    dateInput instanceof Date
      ? dateInput
      : dateInput !== undefined
      ? new Date(dateInput)
      : getBrasiliaNow();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const partsMap: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    partsMap[part.type] = part.value;
  }

  const year = Number(partsMap.year);
  const month = Number(partsMap.month);
  const day = Number(partsMap.day);
  let hour = Number(partsMap.hour);
  if (hour === 24) hour = 0;
  const minute = Number(partsMap.minute);
  const second = Number(partsMap.second);

  const weekdayStr = (partsMap.weekday || '').toLowerCase();
  const weekdayLookup: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const dayOfWeek =
    weekdayLookup[weekdayStr.slice(0, 3)] ??
    new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd = `${year}-${pad(month)}-${pad(day)}`;
  const mesAno = `${year}-${pad(month)}`;
  const hhmm = `${pad(hour)}:${pad(minute)}`;
  const hhmmss = `${hhmm}:${pad(second)}`;
  const ddmmyyyy = `${pad(day)}/${pad(month)}/${year}`;
  const formatted = `${ddmmyyyy} ${hhmmss}`;
  const iso = `${ymd}T${hhmmss}-03:00`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    ymd,
    mesAno,
    hhmm,
    hhmmss,
    ddmmyyyy,
    formatted,
    iso,
    dayOfWeek,
    minutesOfDay: hour * 60 + minute,
  };
}

export function getBrasiliaYmd(dateInput?: Date | string | number): string {
  return getBrasiliaParts(dateInput).ymd;
}

export function getBrasiliaMonthYear(dateInput?: Date | string | number): string {
  return getBrasiliaParts(dateInput).mesAno;
}

export function getBrasiliaMinutesOfDay(dateInput?: Date | string | number): number {
  return getBrasiliaParts(dateInput).minutesOfDay;
}

export function getBrasiliaDayOfWeek(dateInput?: Date | string | number): number {
  return getBrasiliaParts(dateInput).dayOfWeek;
}

export function formatBrasiliaDate(dateInput?: Date | string | number): string {
  return getBrasiliaParts(dateInput).ddmmyyyy;
}

export function formatBrasiliaTime(dateInput?: Date | string | number, withSeconds = false): string {
  const parts = getBrasiliaParts(dateInput);
  return withSeconds ? parts.hhmmss : parts.hhmm;
}

export function getMonthLabelPtBr(mesAno: string): string {
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const [anoStr, mesStr] = (mesAno || '').split('-');
  const mesIdx = Number(mesStr) - 1;
  if (!anoStr || Number.isNaN(mesIdx) || mesIdx < 0 || mesIdx > 11) {
    return mesAno;
  }
  return `${meses[mesIdx]}/${anoStr}`;
}
