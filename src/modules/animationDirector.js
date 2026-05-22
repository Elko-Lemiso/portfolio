import * as CONSTANTS from '../constants';
import writeChar, { flushBuffer } from '../lib/writeChar';
import delay from '../utils/delay';

/**
 * Animation Director
 * orchestrates the portfolio introduction
 */

export const AnimationDirector = {
    async start(config) {
        const { styleEl, workEl, styleText, workText, createWorkBox, showDock, addControls, isDev } = config;

        const speed = isDev ? CONSTANTS.SPEED_MULTIPLIER.DEV : CONSTANTS.SPEED_MULTIPLIER.PROD;
        const commentSpeed = isDev ? CONSTANTS.COMMENT_SPEED_MULTIPLIER.DEV : CONSTANTS.COMMENT_SPEED_MULTIPLIER.PROD;

        try {
            // Phase 0: Intro
            await this.writeTo(styleEl, styleText[0], 0, commentSpeed, true, 1);
            await delay(CONSTANTS.PHASE_DELAYS.AFTER_INTRO);

            // Phase 1: Dock
            await this.writeTo(styleEl, styleText[1], 0, speed, true, 1);
            await delay(CONSTANTS.PHASE_DELAYS.AFTER_DOCK);

            // Phase 2: Portfolio
            await this.writeTo(workEl, workText, 0, speed, false, 1);
            createWorkBox();
            await delay(CONSTANTS.PHASE_DELAYS.AFTER_PORTFOLIO);

            // Phase 3: Style
            await this.writeTo(styleEl, styleText[2], 0, speed, true, 1);
            await delay(CONSTANTS.PHASE_DELAYS.AFTER_STYLE);

            // Phase 4: Final
            await this.writeTo(styleEl, styleText[3], 0, speed, true, 1);
            await delay(CONSTANTS.PHASE_DELAYS.AFTER_FINAL);

            flushBuffer(styleEl);
            flushBuffer(workEl);

            showDock();
            setTimeout(addControls, CONSTANTS.WINDOW_CONTROLS_DELAY);

        } catch (e) {
            if (e.message === "SKIP IT") {
                // Handled by caller or just ignored as flow control
            } else {
                throw e;
            }
        }
    },

    /**
     * Helper to write text with pauses
     */
    async writeTo(el, message, index, interval, mirrorToStyle, charsPerInterval) {
        if (window.animationSkipped) throw new Error('SKIP IT');

        // Write char directly using our optimized writer
        // We write one char at a time to maintain the visual typing effect
        let char = message.slice(index, index + charsPerInterval);
        index += charsPerInterval;

        // Auto-scroll inside writeChar now? No, writeChar updates buffer.
        // We need to pass the style element if mirroring
        let styleMirror = mirrorToStyle ? document.getElementById('style-tag') : null;
        writeChar(el, char, styleMirror);

        // Recursive delay loop
        if (index < message.length) {
            let thisInterval = interval;
            let thisSlice = message.slice(index - 2, index + 1);

            // Regex checks (simple versions)
            if (/\D[\,]\s$/.test(thisSlice)) thisInterval = interval * CONSTANTS.PAUSE_MULTIPLIERS.COMMA;
            if (/[^\/]\n\n$/.test(thisSlice)) thisInterval = interval * CONSTANTS.PAUSE_MULTIPLIERS.END_OF_BLOCK;
            if (/[\.\?\!]\s$/.test(thisSlice)) thisInterval = interval * CONSTANTS.PAUSE_MULTIPLIERS.END_OF_SENTENCE;

            await delay(thisInterval);
            return this.writeTo(el, message, index, interval, mirrorToStyle, charsPerInterval);
        }
    }
};
