// Made to replace lodash functions with their native alternatives. Typed for better TypeScript support.

/**
 * Creates a new array of unique items based on an specific identifier.
 * This function uses a Map to ensure that each item is unique based on the result of the provided function.
 * @param {Array} arr - The array to filter for unique items
 * @param {Function} fn - A function that takes an item and returns a unique identifier
 * @returns {Array} A new array containing only unique items based on the identifier
 * @example
 * const items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 1, name: 'C' }];
 * const uniqueItems = uniqBy(items, item => item.id);
 * // uniqueItems will be [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
 */
export const uniqBy = <T, K>(arr: T[], fn: (item: T) => K): T[] => 
    Array.from(new Map(arr.map(item => [fn(item), item])).values())

/**
 * Recursively merges multiple objects into a single object.
 * If the same key exists in multiple objects and the values are both objects,
 * they will be deep merged. Otherwise, the latter value will override the former.
 * 
 * @param {...object[]} a - An array of objects to be merged
 * @returns {Record<string, unknown>} A new object containing all merged properties
 * 
 * @example
 * const obj1 = { a: { b: 2 }, c: 3 };
 * const obj2 = { a: { d: 4 }, e: 5 };
 * deepMerge(obj1, obj2); // { a: { b: 2, d: 4 }, c: 3, e: 5 }
 */
export const deepMerge = (...a: (object)[]): Record<string, unknown> => 
    a.reduce((r: { [key: string]: unknown }, o) => 
    (Object.entries(o).forEach(([k, v]) => { r[k] = r[k] && typeof r[k] === 'object' && typeof v === 'object' ? 
        deepMerge(r[k], v) : v }), r), {} as Record<string, unknown>)

/**
 * Sort an array of objects by a specific key.
 * 
 * @param {string} key - The key to sort by
 * @returns {function} A comparison function for sorting
 */
export const sortBy = <T>(key: keyof T): ((a: T, b: T) => number) => {
    return (a: T, b: T) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0)
}