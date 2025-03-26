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
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
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

// Format a date relative to now (e.g., "2 hours ago")
export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);

    // Convert milliseconds to seconds
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'just now';

    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    // Convert to days
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

    // Convert to months
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

    // Convert to years
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
} 