/**
 * Storage utility for persisting names to localStorage
 */

const STORAGE_KEY = 'whos-next:names';

const DEFAULT_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];

/**
 * Save names array to localStorage
 * @param {string[]} names - Array of names to save
 */
export function saveNames(names) {
    try {
        const namesText = names.join('\n');
        localStorage.setItem(STORAGE_KEY, namesText);
    } catch (error) {
        console.error('Failed to save names to localStorage:', error);
    }
}

/**
 * Load names from localStorage
 * @returns {string[]} - Array of names (defaults if none saved)
 */
export function loadNames() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return saved.split('\n').filter((line) => line.trim().length > 0);
        }
    } catch (error) {
        console.error('Failed to load names from localStorage:', error);
    }

    return DEFAULT_NAMES;
}

/**
 * Clear saved names from localStorage
 */
export function clearNames() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear names from localStorage:', error);
    }
}
