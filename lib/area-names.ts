export function normalizeAreaName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function areaNameKey(value: string): string {
  return normalizeAreaName(value).toLocaleLowerCase();
}

export function uniqueAreaNames(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const name = normalizeAreaName(value);
    const key = areaNameKey(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }

  return result.sort((left, right) => left.localeCompare(right, 'bn'));
}
