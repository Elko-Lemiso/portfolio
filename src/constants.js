/**
 * Application Constants
 * Centralized configuration values for the portfolio application
 */

// ============================================================================
// Animation Speeds
// ============================================================================

/**
 * Base animation speed multiplier
 * Dev mode: 0.05 for instant testing
 * Prod mode: 2 for smooth user experience
 */
export const SPEED_MULTIPLIER = {
  DEV: 0.05,
  PROD: 2
};

/**
 * Comment typing speed
 * Slower to give users time to read
 */
export const COMMENT_SPEED_MULTIPLIER = {
  DEV: 0.2,
  PROD: 16
};

/**
 * CSS property typing speed multiplier
 * Relative to base speed
 */
export const CSS_SPEED_RATIO = 0.3;

/**
 * Animation pause multipliers for punctuation
 * Creates natural reading rhythm
 */
export const PAUSE_MULTIPLIERS = {
  COMMA: 30,
  END_OF_BLOCK: 50,
  END_OF_SENTENCE: 70
};

/**
 * Inter-phase delays (milliseconds)
 * Pauses between major animation phases
 */
export const PHASE_DELAYS = {
  AFTER_INTRO: 1000,
  AFTER_DOCK: 1000,
  AFTER_PORTFOLIO: 800,
  AFTER_STYLE: 800,
  AFTER_FINAL: 1000
};

// ============================================================================
// DOM Update Optimization
// ============================================================================

/**
 * Number of characters to buffer before updating DOM
 * Reduces reflows/repaints during animation
 */
export const UPDATE_THRESHOLD = 5;

/**
 * Threshold for simple (non-highlighted) text
 * Can be higher since no syntax highlighting
 */
export const SIMPLE_UPDATE_THRESHOLD = 10;

// ============================================================================
// Window Management
// ============================================================================

/**
 * Minimum visible area when dragging windows (pixels)
 * Prevents windows from being dragged completely off-screen
 */
export const MIN_VISIBLE_WINDOW_AREA = 40;

/**
 * Minimum window dimensions (pixels)
 */
export const MIN_WINDOW_SIZE = {
  WIDTH: 200,
  HEIGHT: 150
};

/**
 * Reserved space at bottom for dock (pixels)
 */
export const DOCK_HEIGHT = 110;

/**
 * Window title bar height (pixels)
 */
export const TITLE_BAR_HEIGHT = 40;

/**
 * Z-index management
 */
export const Z_INDEX = {
  BASE: 1000,
  MAX: 9999
};

/**
 * Resize handle dimensions (pixels)
 */
export const RESIZE_HANDLE = {
  CORNER_SIZE: 10,
  EDGE_WIDTH: 5
};

// ============================================================================
// Console Management
// ============================================================================

/**
 * Maximum console history lines
 * Prevents memory bloat from excessive logging
 */
export const MAX_CONSOLE_HISTORY = 100;

/**
 * JavaScript console panel height (pixels)
 */
export const CONSOLE_PANEL_HEIGHT = 120;

// ============================================================================
// Window Initialization Positions
// ============================================================================

/**
 * Default window positions and sizes
 */
export const DEFAULT_WINDOW_CONFIG = {
  JEFFREY: {
    left: '20%',
    top: '15%',
    width: '680px',
    height: '440px'
  },
  JAVASCRIPT: {
    left: '15%',
    top: '25%',
    width: '600px',
    height: '500px'
  },
  HTML: {
    left: '25%',
    top: '20%',
    width: '600px',
    height: '450px'
  }
};

// ============================================================================
// Timing Constants
// ============================================================================

/**
 * Delay before adding window controls (milliseconds)
 * Allows DOM to settle before attaching event listeners
 */
export const WINDOW_CONTROLS_DELAY = 100;
