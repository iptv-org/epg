/**
 * Sorts an array by the result of running each element through an iteratee function.
 * Creates a shallow copy of the array before sorting to avoid mutating the original.
 *
 * @param {Array} arr - The array to sort
 * @param {Function} fn - The iteratee function to compute sort values
 * @returns {Array} A new sorted array
 *
 * @example
 * const users = [{name: 'john', age: 30}, {name: 'jane', age: 25}];
 * sortBy(users, x => x.age); // [{name: 'jane', age: 25}, {name: 'john', age: 30}]
 */
export const sortBy = <T>(arr: T[], fn: (item: T) => number | string): T[] =>
  [...arr].sort((a, b) => (fn(a) > fn(b) ? 1 : -1))

/**
 * Sorts an array by multiple criteria with customizable sort orders.
 * Supports ascending (default) and descending order for each criterion.
 *
 * @param {Array} arr - The array to sort
 * @param {Array<Function>} fns - Array of iteratee functions to compute sort values
 * @param {Array<string>} orders - Array of sort orders ('asc' or 'desc'), defaults to all 'asc'
 * @returns {Array} A new sorted array
 *
 * @example
 * const users = [{name: 'john', age: 30}, {name: 'jane', age: 25}, {name: 'bob', age: 30}];
 * orderBy(users, [x => x.age, x => x.name], ['desc', 'asc']);
 * // [{name: 'bob', age: 30}, {name: 'john', age: 30}, {name: 'jane', age: 25}]
 */
export const orderBy = (
  arr: unknown[],
  fns: ((item: unknown) => string | number)[],
  orders: string[] = []
): unknown[] =>
  [...arr].sort((a, b) =>
    fns.reduce(
      (acc, fn, i) =>
        acc ||
        ((orders[i] === 'desc' ? fn(b) > fn(a) : fn(a) > fn(b)) ? 1 : fn(a) === fn(b) ? 0 : -1),
      0
    )
  )

/**
 * Creates a duplicate-free version of an array using an iteratee function to generate
 * the criterion by which uniqueness is computed. Only the first occurrence of each
 * element is kept.
 *
 * @param {Array} arr - The array to inspect
 * @param {Function} fn - The iteratee function to compute uniqueness criterion
 * @returns {Array} A new duplicate-free array
 *
 * @example
 * const users = [{id: 1, name: 'john'}, {id: 2, name: 'jane'}, {id: 1, name: 'john'}];
 * uniqBy(users, x => x.id); // [{id: 1, name: 'john'}, {id: 2, name: 'jane'}]
 */
export const uniqBy = <T>(arr: T[], fn: (item: T) => unknown): T[] =>
  arr.filter((item, index) => arr.findIndex(x => fn(x) === fn(item)) === index)

/**
 * Converts a string to start case (capitalizes the first letter of each word).
 * Handles camelCase, snake_case, kebab-case, and regular spaces.
 *
 * @param {string} str - The string to convert
 * @returns {string} The start case string
 *
 * @example
 * startCase('hello_world'); // "Hello World"
 * startCase('helloWorld'); // "Hello World"
 * startCase('hello-world'); // "Hello World"
 * startCase('hello world'); // "Hello World"
 */
export const startCase = (str: string): string =>
  str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize first letter of each word
