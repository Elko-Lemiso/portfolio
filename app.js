import 'classlist-polyfill';
import Promise from 'bluebird';
import Markdown from 'markdown';
const md = Markdown.markdown.toHTML;
import workText from 'raw-loader!./work.txt';
import headerHTML from 'raw-loader!./header.html';
let styleText = [0, 1, 2, 3].map((i) => require('raw-loader!./styles' + i + '.css').default);
import preStyles from 'raw-loader!./prestyles.css';
import replaceURLs from './lib/replaceURLs';
import {default as writeChar, writeSimpleChar, handleChar} from './lib/writeChar';
import getPrefix from './lib/getPrefix';

// Vars that will help us get er done
const isDev = window.location.hostname === 'localhost';
const speed = isDev ? 0.05 : 2; // Much faster animation - 3x faster than before
const commentSpeed = isDev ? 0.2 : 16; // Keep comments at original speed for readability
const cssSpeed = speed * 0.3; // Faster for CSS properties
let style, styleEl, workEl, skipAnimationEl;
let jsEl, htmlEl, consoleEl, htmlTargetEl;
let animationSkipped = false, done = false;
let browserPrefix;

// Wait for load to get started.
document.addEventListener("DOMContentLoaded", function() {
  getBrowserPrefix();
  populateHeader();
  getEls();
  createEventHandlers();
  startAnimation();
});

async function startAnimation() {
  try {
    // Phase 0: Introduction and basic styling (comments slow, CSS fast)
    await writeTo(styleEl, styleText[0], 0, commentSpeed, true, 1);
    await Promise.delay(1000); // Pause after intro so you can read it

    // Phase 1: Style the dock
    await writeTo(styleEl, styleText[1], 0, speed, true, 1);
    await Promise.delay(1000); // Pause to admire the dock

    // Phase 2: Show portfolio content
    await writeTo(workEl, workText, 0, speed, false, 1);
    createWorkBox();
    await Promise.delay(800); // Pause to see the content

    // Phase 3: Style the markdown content beautifully
    await writeTo(styleEl, styleText[2], 0, speed, true, 1);
    await Promise.delay(800);

    // Phase 4: Final polish
    await writeTo(styleEl, styleText[3], 0, speed, true, 1);
    await Promise.delay(1000); // Final pause

    // Add window controls after animation completes
    done = true;
    showAllDockItems(); // Show all dock items after animation
    setTimeout(() => addWindowControls(), 100);
  }
  // Flow control straight from the ghettos of Milwaukee
  catch(e) {
    if (e.message === "SKIP IT") {
      surprisinglyShortAttentionSpan();
    } else {
      throw e;
    }
  }
}

// Skips all the animations.
async function surprisinglyShortAttentionSpan() {
  if (done) return;
  done = true;
  let txt = styleText.join('\n');

  // The work-text animations are rough
  style.textContent = "#work-text * { " + browserPrefix + "transition: none; }";
  style.textContent += txt;
  let styleHTML = "";
  for(let i = 0; i < txt.length; i++) {
     styleHTML = handleChar(styleHTML, txt[i]);
  }
  styleEl.innerHTML = styleHTML;
  createWorkBox();

  // Scroll to top for the new layout
  workEl.scrollTop = 0;

  // Show all dock items
  showAllDockItems();

  // Add window controls after animation
  setTimeout(() => addWindowControls(), 100);
}

// Show all dock items after animation completes
function showAllDockItems() {
  console.log('showAllDockItems called');
  const dockItems = document.querySelectorAll('.dock-item:not(#skip-animation)');
  console.log('Found dock items:', dockItems.length);
  dockItems.forEach(item => {
    console.log('Showing dock item:', item.id);
    item.style.setProperty('display', 'flex', 'important');
  });

  // Show separators
  const separators = document.querySelectorAll('.dock-separator');
  separators.forEach(sep => {
    sep.style.setProperty('display', 'block', 'important');
  });

  // Hide skip button after animation
  if (skipAnimationEl) {
    skipAnimationEl.style.setProperty('display', 'none', 'important');
  }
}


/**
 * Helpers
 */

let endOfSentence = /[\.\?\!]\s$/;
let comma = /\D[\,]\s$/;
let endOfBlock = /[^\/]\n\n$/;

async function writeTo(el, message, index, interval, mirrorToStyle, charsPerInterval){
  if (animationSkipped) {
    // Lol who needs proper flow control
    throw new Error('SKIP IT');
  }
  // Write a character or multiple characters to the buffer.
  let chars = message.slice(index, index + charsPerInterval);
  index += charsPerInterval;

  // Ensure we stay scrolled to the bottom.
  el.scrollTop = el.scrollHeight;

  // If this is going to <style> it's more complex; otherwise, just write.
  if (mirrorToStyle) {
    writeChar(el, chars, style);
  } else {
    writeSimpleChar(el, chars);
  }

  // Schedule another write.
  if (index < message.length) {
    let thisInterval = interval;
    let thisSlice = message.slice(index - 2, index + 1);
    if (comma.test(thisSlice)) thisInterval = interval * 30;
    if (endOfBlock.test(thisSlice)) thisInterval = interval * 50;
    if (endOfSentence.test(thisSlice)) thisInterval = interval * 70;

    await Promise.delay(thisInterval);

    return writeTo(el, message, index, interval, mirrorToStyle, charsPerInterval);
  }
}

//
// Older versions of major browsers (like Android) still use prefixes. So we figure out what that prefix is
// and use it.
//
function getBrowserPrefix() {
  // Ghetto per-browser prefixing
  browserPrefix = getPrefix(); // could be empty string, which is fine
  styleText = styleText.map(function(text) {
    return text.replace(/-webkit-/g, browserPrefix);
  });
}

//
// Put els into the module scope.
//
function getEls() {
  // We're cheating a bit on styles.
  let preStyleEl = document.createElement('style');
  preStyleEl.textContent = preStyles;
  document.head.insertBefore(preStyleEl, document.getElementsByTagName('style')[0]);

  // El refs
  style = document.getElementById('style-tag');
  styleEl = document.getElementById('style-text');
  workEl = document.getElementById('work-text');
  skipAnimationEl = document.getElementById('skip-animation');
}

//
// Create links in header (now footer).
//
function populateHeader() {
  let header = document.getElementById('header');
  header.innerHTML = headerHTML;
}

//
// Create basic event handlers for user input.
//
function createEventHandlers() {
  // Mirror user edits back to the style element.
  styleEl.addEventListener('input', function() {
    style.textContent = styleEl.textContent;
  });

  // Skip anim on click to skipAnimation
  skipAnimationEl.addEventListener('click', function(e) {
    e.preventDefault();
    animationSkipped = true;
  });

  // Reopen terminal window
  const reopenTerminal = document.getElementById('reopen-terminal');
  if (reopenTerminal) {
    reopenTerminal.addEventListener('click', function(e) {
      e.preventDefault();
      styleEl.style.display = 'block';
      bringWindowToFront(styleEl);
    });
  }

  // Reopen portfolio window
  const reopenPortfolio = document.getElementById('reopen-portfolio');
  if (reopenPortfolio) {
    reopenPortfolio.addEventListener('click', function(e) {
      e.preventDefault();
      workEl.style.display = 'block';
      bringWindowToFront(workEl);
    });
  }

  // Open Jeffrey video window
  const openJeffrey = document.getElementById('open-jeffrey');
  if (openJeffrey) {
    openJeffrey.addEventListener('click', function(e) {
      e.preventDefault();
      createJeffreyWindow();
    });
  }

  // Open JavaScript editor window
  const openJsEditor = document.getElementById('open-js-editor');
  if (openJsEditor) {
    openJsEditor.addEventListener('click', function(e) {
      e.preventDefault();
      createJavaScriptWindow();
    });
  }

  // Open HTML editor window
  const openHtmlEditor = document.getElementById('open-html-editor');
  if (openHtmlEditor) {
    openHtmlEditor.addEventListener('click', function(e) {
      e.preventDefault();
      createHTMLWindow();
    });
  }

  // Add window controls to each window
  addWindowControls();
}

//
// Add macOS window control buttons to each pre element
//
function addWindowControls() {
  const windows = document.querySelectorAll('pre:not(:empty)');

  windows.forEach(windowEl => {
    // Check if controls already exist
    if (windowEl.hasAttribute('data-has-controls')) return;
    windowEl.setAttribute('data-has-controls', 'true');

    // Set up window for dragging
    windowEl.style.position = 'absolute';
    windowEl.style.userSelect = 'none';

    // Get initial position from CSS or set default
    const computedStyle = window.getComputedStyle(windowEl);
    if (!windowEl.style.left) {
      windowEl.style.left = computedStyle.left;
    }
    if (!windowEl.style.top) {
      windowEl.style.top = computedStyle.top;
    }

    // Create sticky header container
    const headerContainer = document.createElement('div');
    headerContainer.className = 'window-header-sticky';

    // Create title bar background
    const titleBarBg = document.createElement('div');
    titleBarBg.className = 'window-titlebar-bg';
    headerContainer.appendChild(titleBarBg);

    // Create draggable title bar overlay
    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar-draggable';
    headerContainer.appendChild(titleBar);

    // Create window title
    const windowTitle = document.createElement('div');
    windowTitle.className = 'window-title';
    // Set title based on window ID
    if (windowEl.id === 'style-text') {
      windowTitle.textContent = 'Terminal — 3lko.com';
    } else if (windowEl.id === 'work-text') {
      windowTitle.textContent = 'Portfolio — Elko Lemiso';
    } else if (windowEl.id === 'jeffrey-window') {
      windowTitle.textContent = 'Jeffrey — 3lko.com';
    }
    headerContainer.appendChild(windowTitle);

    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'window-controls';
    headerContainer.appendChild(controls);

    // Add header to window
    windowEl.insertBefore(headerContainer, windowEl.firstChild);

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'window-button close';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      windowEl.style.display = 'none';

      // Clean up event listeners to prevent memory leaks
      if (windowEl._dragCleanup) windowEl._dragCleanup();
      if (windowEl._resizeCleanup) windowEl._resizeCleanup();
    });

    // Minimize button
    const minimizeBtn = document.createElement('div');
    minimizeBtn.className = 'window-button minimize';
    minimizeBtn.title = 'Minimize';
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (windowEl.classList.contains('minimized')) {
        windowEl.classList.remove('minimized');
      } else {
        windowEl.classList.remove('maximized');
        windowEl.classList.add('minimized');
      }
    });

    // Maximize button
    const maximizeBtn = document.createElement('div');
    maximizeBtn.className = 'window-button maximize';
    maximizeBtn.title = 'Maximize';
    maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (windowEl.classList.contains('maximized')) {
        windowEl.classList.remove('maximized');
      } else {
        windowEl.classList.remove('minimized');
        windowEl.classList.add('maximized');
      }
    });

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);

    // Add dragging functionality
    makeWindowDraggable(windowEl, titleBar);

    // Add resize functionality
    makeWindowResizable(windowEl);

    // Add z-index management
    windowEl.addEventListener('mousedown', () => {
      bringWindowToFront(windowEl);
    });
  });
}

//
// Make a window draggable by its title bar (GPU-accelerated with cleanup)
//
function makeWindowDraggable(windowEl, titleBar) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;
  let rafId = null;

  function dragStart(e) {
    // Don't drag if clicking on window buttons
    if (e.target.classList.contains('window-button')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    // Get current position
    startLeft = parseInt(windowEl.style.left) || 0;
    startTop = parseInt(windowEl.style.top) || 0;

    // Enable GPU acceleration
    windowEl.style.willChange = 'left, top';
    titleBar.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();

    // Cancel previous frame if still pending
    if (rafId) cancelAnimationFrame(rafId);

    // Use requestAnimationFrame for smooth animation
    rafId = requestAnimationFrame(() => {
      // Calculate new position
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;

      // Get window dimensions
      const windowWidth = windowEl.offsetWidth;
      const windowHeight = windowEl.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dockHeight = 110; // Reserve space for dock at bottom

      // Constrain to viewport boundaries
      // Keep at least 40px (title bar height) visible
      const minVisible = 40;
      newLeft = Math.max(minVisible - windowWidth, Math.min(newLeft, viewportWidth - minVisible));
      newTop = Math.max(0, Math.min(newTop, viewportHeight - dockHeight - minVisible));

      windowEl.style.left = newLeft + 'px';
      windowEl.style.top = newTop + 'px';
    });
  }

  function dragEnd(e) {
    if (isDragging) {
      isDragging = false;
      titleBar.style.cursor = 'grab';
      // Remove GPU acceleration hint
      windowEl.style.willChange = 'auto';

      // Clear any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  }

  // Store cleanup function on the window element
  windowEl._dragCleanup = () => {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  titleBar.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
}

//
// Make a window resizable (GPU-accelerated with cleanup)
//
function makeWindowResizable(windowEl) {
  // Create resize handles for all 8 positions
  const positions = [
    { class: 'resize-handle-nw', cursor: 'nw-resize' },
    { class: 'resize-handle-n', cursor: 'n-resize' },
    { class: 'resize-handle-ne', cursor: 'ne-resize' },
    { class: 'resize-handle-e', cursor: 'e-resize' },
    { class: 'resize-handle-se', cursor: 'se-resize' },
    { class: 'resize-handle-s', cursor: 's-resize' },
    { class: 'resize-handle-sw', cursor: 'sw-resize' },
    { class: 'resize-handle-w', cursor: 'w-resize' }
  ];

  positions.forEach(pos => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${pos.class}`;
    handle.style.cursor = pos.cursor;
    handle.dataset.direction = pos.class.replace('resize-handle-', '');
    windowEl.appendChild(handle);
  });

  let isResizing = false;
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  let currentDirection = '';
  let rafId = null;

  function onResizeStart(e) {
    // Don't resize if minimized or maximized
    if (windowEl.classList.contains('minimized') || windowEl.classList.contains('maximized')) {
      return;
    }

    // Check if this is a resize handle
    if (!e.target.classList.contains('resize-handle')) return;

    isResizing = true;
    currentDirection = e.target.dataset.direction;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
    startHeight = parseInt(window.getComputedStyle(windowEl).height, 10);
    startLeft = parseInt(windowEl.style.left) || 0;
    startTop = parseInt(windowEl.style.top) || 0;

    // Enable GPU acceleration
    windowEl.style.willChange = 'width, height, left, top';

    e.stopPropagation();
    e.preventDefault();
  }

  function onResizeMove(e) {
    if (!isResizing) return;

    e.preventDefault();

    // Cancel previous frame if still pending
    if (rafId) cancelAnimationFrame(rafId);

    // Use requestAnimationFrame for smooth resizing
    rafId = requestAnimationFrame(() => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dockHeight = 110;

      // Set minimum sizes
      const minWidth = 200;
      const minHeight = 150;

      // Apply resize based on direction
      if (currentDirection.includes('e')) {
        newWidth = startWidth + deltaX;
      }
      if (currentDirection.includes('w')) {
        newWidth = startWidth - deltaX;
        newLeft = startLeft + deltaX;
      }
      if (currentDirection.includes('s')) {
        newHeight = startHeight + deltaY;
      }
      if (currentDirection.includes('n')) {
        newHeight = startHeight - deltaY;
        newTop = startTop + deltaY;
      }

      // Constrain to minimum sizes
      if (newWidth < minWidth) {
        newWidth = minWidth;
        if (currentDirection.includes('w')) {
          newLeft = startLeft + (startWidth - minWidth);
        }
      }
      if (newHeight < minHeight) {
        newHeight = minHeight;
        if (currentDirection.includes('n')) {
          newTop = startTop + (startHeight - minHeight);
        }
      }

      // Constrain to viewport
      const maxWidth = viewportWidth - newLeft - 10;
      const maxHeight = viewportHeight - newTop - dockHeight - 10;

      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.min(newHeight, maxHeight);

      // Constrain position
      newLeft = Math.max(minWidth - newWidth + 40, Math.min(newLeft, viewportWidth - 40));
      newTop = Math.max(0, Math.min(newTop, viewportHeight - dockHeight - 40));

      windowEl.style.width = newWidth + 'px';
      windowEl.style.height = newHeight + 'px';
      windowEl.style.maxHeight = newHeight + 'px';
      windowEl.style.left = newLeft + 'px';
      windowEl.style.top = newTop + 'px';
    });
  }

  function onResizeEnd() {
    if (isResizing) {
      isResizing = false;
      // Remove GPU acceleration hint
      windowEl.style.willChange = 'auto';

      // Clear any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  }

  // Store cleanup function on the window element
  windowEl._resizeCleanup = () => {
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Add event listeners to all resize handles
  windowEl.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', onResizeStart);
  });

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
}

//
// Bring window to front when clicked (with overflow protection)
//
let highestZIndex = 1000;
const MAX_Z_INDEX = 9999;
function bringWindowToFront(windowEl) {
  highestZIndex++;

  // Reset z-indexes if we're approaching the limit
  if (highestZIndex > MAX_Z_INDEX) {
    const allWindows = document.querySelectorAll('pre:not(:empty)');
    allWindows.forEach((win, index) => {
      win.style.zIndex = 1000 + index;
    });
    highestZIndex = 1000 + allWindows.length;
  }

  windowEl.style.zIndex = highestZIndex;
}

//
// Fire a listener when scrolling the 'work' box.
//

function createWorkBox() {
  if (workEl.classList.contains('flipped')) return;
  // Just show the rendered markdown - no dual view, no flip
  workEl.innerHTML = '<div class="md">' + replaceURLs(md(workText)) + '</div>';

  workEl.classList.add('flipped');
  workEl.scrollTop = 0;

  // Simple scrolling - no flip, just like real macOS Terminal
  require('mouse-wheel')(workEl, async function(dx, dy) {
    workEl.scrollTop += dy;
  }, true);
}

//
// Create Jeffrey video window
//
let jeffreyWindow = null;
function createJeffreyWindow() {
  // If window already exists, just show it
  if (jeffreyWindow) {
    jeffreyWindow.style.display = 'block';
    bringWindowToFront(jeffreyWindow);
    return;
  }

  // Create new Jeffrey window
  jeffreyWindow = document.createElement('pre');
  jeffreyWindow.id = 'jeffrey-window';
  jeffreyWindow.innerHTML = `
    <div style="padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.3);">
      <video
        autoplay
        loop
        muted
        playsinline
        style="width: 100%; height: auto; border-radius: 8px; max-width: 600px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);"
      >
        <source src="/ico/jeffrey.webm" type="video/webm">
        Your browser doesn't support video playback.
      </video>
    </div>
  `;

  // Style the Jeffrey window - optimized for 16:9 video
  jeffreyWindow.style.left = '20%';
  jeffreyWindow.style.top = '15%';
  jeffreyWindow.style.width = '680px';
  jeffreyWindow.style.height = '440px';
  jeffreyWindow.style.maxHeight = '440px';

  // Add to DOM
  document.getElementById('content').appendChild(jeffreyWindow);

  // Add window controls
  setTimeout(() => {
    addWindowControls();
    bringWindowToFront(jeffreyWindow);
  }, 100);
}

//
// JavaScript Editor Window
//
let jsWindow = null;
function createJavaScriptWindow() {
  if (jsWindow) {
    jsWindow.style.display = 'block';
    bringWindowToFront(jsWindow);
    return;
  }

  jsWindow = document.createElement('pre');
  jsWindow.id = 'js-window';
  jsWindow.contentEditable = true;
  jsWindow.spellcheck = false;
  jsWindow.textContent = `// JavaScript Editor
// Write JavaScript code here
// Press Ctrl+Enter (Cmd+Enter on Mac) to execute

console.log("Hello from JavaScript!");

// Try changing the background
document.body.style.background = "linear-gradient(45deg, #667eea 0%, #764ba2 100%)";

// Or create elements
const box = document.createElement('div');
box.textContent = 'Created with JS!';
box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px;background:rgba(255,255,255,0.1);backdrop-filter:blur(20px);border-radius:10px;color:white;';
document.body.appendChild(box);
`;

  // Style the JS window
  jsWindow.style.left = '15%';
  jsWindow.style.top = '25%';
  jsWindow.style.width = '600px';
  jsWindow.style.height = '500px';

  // Add console output area
  const consoleOutput = document.createElement('div');
  consoleOutput.id = 'js-console';
  consoleOutput.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px;
    font-size: 11px;
    color: #a0a0a0;
    overflow-y: auto;
    font-family: monospace;
  `;
  jsWindow.appendChild(consoleOutput);

  // Add to DOM
  document.getElementById('content').appendChild(jsWindow);

  // Set up execution
  jsWindow.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeJavaScript(jsWindow.textContent);
    }
  });

  // Intercept console for this window
  setupConsoleInterception(consoleOutput);

  // Add window controls
  setTimeout(() => {
    addWindowControls();
    bringWindowToFront(jsWindow);
  }, 100);
}

//
// HTML Editor Window
//
let htmlWindow = null;
function createHTMLWindow() {
  if (htmlWindow) {
    htmlWindow.style.display = 'block';
    bringWindowToFront(htmlWindow);
    return;
  }

  htmlWindow = document.createElement('pre');
  htmlWindow.id = 'html-window';
  htmlWindow.contentEditable = true;
  htmlWindow.spellcheck = false;
  htmlWindow.textContent = `<!-- HTML Editor -->
<!-- Write HTML here -->
<!-- Press Ctrl+Enter (Cmd+Enter on Mac) to inject into page -->

<div style="
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  color: white;
  font-size: 24px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
">
  Hello from HTML! 👋
  <br>
  <button onclick="this.parentElement.remove()" style="margin-top:10px;padding:10px 20px;background:rgba(255,255,255,0.2);border:none;border-radius:8px;color:white;cursor:pointer;">
    Close
  </button>
</div>
`;

  // Style the HTML window
  htmlWindow.style.left = '25%';
  htmlWindow.style.top = '20%';
  htmlWindow.style.width = '600px';
  htmlWindow.style.height = '450px';

  // Add to DOM
  document.getElementById('content').appendChild(htmlWindow);

  // Set up injection
  htmlWindow.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      injectHTML(htmlWindow.textContent);
    }
  });

  // Add window controls
  setTimeout(() => {
    addWindowControls();
    bringWindowToFront(htmlWindow);
  }, 100);
}

function executeJavaScript(code) {
  if (!code.trim()) return;

  try {
    const func = new Function(code);
    func();
    if (jsWindow) {
      const console = jsWindow.querySelector('#js-console');
      if (console) {
        const line = document.createElement('div');
        line.style.color = '#6bcfff';
        line.textContent = '✓ Code executed successfully';
        console.appendChild(line);
        console.scrollTop = console.scrollHeight;
      }
    }
  } catch (error) {
    if (jsWindow) {
      const console = jsWindow.querySelector('#js-console');
      if (console) {
        const line = document.createElement('div');
        line.style.color = '#ff6b6b';
        line.textContent = '✗ Error: ' + error.message;
        console.appendChild(line);
        console.scrollTop = console.scrollHeight;
      }
    }
  }
}

function injectHTML(html) {
  if (!html.trim()) return;

  const targetEl = document.getElementById('html-injection-target');
  if (targetEl) {
    targetEl.innerHTML = html;
  }
}

function setupConsoleInterception(consoleEl) {
  if (!consoleEl) return;

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = function(...args) {
    const line = document.createElement('div');
    line.style.color = '#a0a0a0';
    line.textContent = args.join(' ');
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    originalLog.apply(console, args);
  };

  console.error = function(...args) {
    const line = document.createElement('div');
    line.style.color = '#ff6b6b';
    line.textContent = '✗ ' + args.join(' ');
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    const line = document.createElement('div');
    line.style.color = '#ffd93d';
    line.textContent = '⚠ ' + args.join(' ');
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    originalWarn.apply(console, args);
  };
}

