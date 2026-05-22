/**
 * Native Promise.delay implementation
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export default (ms) => new Promise(resolve => setTimeout(resolve, ms));
