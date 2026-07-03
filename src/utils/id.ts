/**
 * Generator ID sederhana — cukup untuk kebutuhan lokal app ini,
 * tanpa perlu tambah dependency uuid.
 */
export function generateId(prefix: string = 'id'): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timePart}${randomPart}`;
}
