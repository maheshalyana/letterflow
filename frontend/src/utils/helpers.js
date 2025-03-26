/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * 
 * @param {Function} func The function to throttle
 * @param {number} wait The number of milliseconds to throttle invocations to
 * @returns {Function} The throttled function
 */
export function throttle(func, wait) {
    let lastCall = 0;

    return function (...args) {
        const now = Date.now();
        if (now - lastCall < wait) return;

        lastCall = now;
        return func(...args);
    };
} 