/**
 * Event Listener Registry - Tracks all event listeners for proper cleanup
 * Uses WeakMap to allow garbage collection when elements are removed
 */
const eventListenerRegistry = new WeakMap();

/**
 * Registers an event listener and tracks it for cleanup
 * @param {Element} element - The element to attach the listener to
 * @param {string} event - Event type (e.g., 'click', 'keydown')
 * @param {Function} handler - Event handler function
 * @param {Object} options - Optional event listener options
 */
export function registerEventListener(element, event, handler, options = false) {
    element.addEventListener(event, handler, options);

    // Get or create the listener array for this element
    if (!eventListenerRegistry.has(element)) {
        eventListenerRegistry.set(element, []);
    }

    const listeners = eventListenerRegistry.get(element);
    listeners.push({ event, handler, options });
}

/**
 * Removes all registered event listeners from an element
 * @param {Element} element - The element to clean up
 */
export function cleanupEventListeners(element) {
    if (!eventListenerRegistry.has(element)) return;

    const listeners = eventListenerRegistry.get(element);
    listeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
    });

    // Clear the registry entry
    eventListenerRegistry.delete(element);
}
