/** deterministic hash -> [0,1) */
export function hash(a: number, b = 0): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function pick<T>(arr: T[], a: number, b = 0): T {
  return arr[Math.min(arr.length - 1, Math.floor(hash(a, b) * arr.length))];
}
