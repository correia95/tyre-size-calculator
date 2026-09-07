// Tyre size maths. Metric tyre notation: WWW/AA RDD  (e.g. 225/45 R17).
// Pure functions.

export interface Tyre {
  width: number; // mm (tread width)
  aspect: number; // % (sidewall height as a % of width)
  rim: number; // in (wheel diameter)
}

export interface Derived {
  sidewallMm: number;
  diameterMm: number;
  diameterIn: number;
  circumferenceMm: number;
  revsPerKm: number;
  revsPerMile: number;
}

const MM_PER_IN = 25.4;

export function derive(t: Tyre): Derived {
  const sidewallMm = (t.width * t.aspect) / 100;
  const diameterMm = t.rim * MM_PER_IN + 2 * sidewallMm;
  const circumferenceMm = Math.PI * diameterMm;
  return {
    sidewallMm,
    diameterMm,
    diameterIn: diameterMm / MM_PER_IN,
    circumferenceMm,
    revsPerKm: 1_000_000 / circumferenceMm,
    revsPerMile: 1_609_344 / circumferenceMm,
  };
}

export interface Comparison {
  a: Derived;
  b: Derived;
  diameterDiffMm: number;
  diameterDiffPct: number;
  // speedo shows old-tyre speed; true speed with the new tyre:
  speedoAt: (indicatedKmh: number) => { trueSpeed: number; error: number };
  clearanceTopMm: number; // extra radius top/bottom
  groundToCentreDiffMm: number;
  odometerErrorPct: number; // % the odometer under/over-reads with tyre B
  parseOk: boolean;
}

export function compare(a: Tyre, b: Tyre): Comparison {
  const da = derive(a);
  const db = derive(b);
  const diameterDiffMm = db.diameterMm - da.diameterMm;
  const ratio = db.diameterMm / da.diameterMm;
  return {
    a: da,
    b: db,
    diameterDiffMm,
    diameterDiffPct: (ratio - 1) * 100,
    speedoAt: (indicated) => {
      const trueSpeed = indicated * ratio;
      return { trueSpeed, error: trueSpeed - indicated };
    },
    clearanceTopMm: diameterDiffMm / 2,
    groundToCentreDiffMm: diameterDiffMm / 2,
    odometerErrorPct: (1 / ratio - 1) * 100,
    parseOk: valid(a) && valid(b),
  };
}

function valid(t: Tyre): boolean {
  return t.width >= 100 && t.width <= 400 && t.aspect >= 20 && t.aspect <= 90 && t.rim >= 8 && t.rim <= 26;
}

// Parse "225/45R17" / "225 45 17" / "225/45 R17" into a Tyre.
export function parseTyre(s: string): Tyre | null {
  const m = s
    .trim()
    .replace(/[Rr]/g, ' ')
    .replace(/[/x-]/g, ' ')
    .split(/\s+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (m.length < 3) return null;
  const [width, aspect, rim] = m;
  const t = { width, aspect, rim };
  return valid(t) ? t : { width, aspect, rim }; // return even if slightly out of range; UI flags it
}

export function fmtTyre(t: Tyre): string {
  return `${t.width}/${t.aspect} R${t.rim}`;
}

export const mm1 = (n: number) => `${Math.round(n * 10) / 10} mm`;
export const pct2 = (n: number) => `${n >= 0 ? '+' : ''}${(Math.round(n * 100) / 100).toFixed(2)}%`;
