/**
 * Last element of an array
 */
export function last<T>(a: T[]): T | undefined {
  if (a.length > 0) {
    return a[a.length - 1]
  }
}

/**
 * First element of array for which fn produces a value, as well as the produced value
 */
export function find<T, R>(array: T[], fn: (i: T) => R | undefined): [T, R] | [] {
  for (const item of array) {
    const res = fn(item)
    if (res) {
      return [item, res]
    }
  }
  return []
}

export const replaceStr = (base: string, from: number, to: number, toInsert: string): string =>
  base.slice(0, from) + toInsert + base.slice(to)
