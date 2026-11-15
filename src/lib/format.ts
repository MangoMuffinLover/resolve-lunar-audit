// Display arithmetic only. Stored evidence is never rounded or rewritten.
export const fixed = (value: number, digits = 2) => value.toFixed(digits);
export const signed = (value: number, digits = 2) =>
  `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;
export const distance = (metres: number) =>
  metres >= 1000 ? `${(metres / 1000).toFixed(3)} km` : `${metres.toFixed(3)} m`;
export const utc = (value: string, withTime = false) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
  }).format(new Date(value));
export const position = (value: number, min: number, max: number) => (value - min) / (max - min);
export const linePath = (
  points: readonly (readonly number[])[],
  x: (v: number) => number,
  y: (v: number) => number,
) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join('');
