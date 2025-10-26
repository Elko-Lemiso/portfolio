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

// Throttle utility for performance
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Vars that will help us get er done
const isDev = window.location.hostname === 'localhost';
const speed = isDev ? 0.2 : 16;
const commentSpeed = speed * 3; // Slower for comments to make it conversational
const cssSpeed = speed * 0.5; // Faster for CSS properties
let style, styleEl, workEl, skipAnimationEl, pauseEl;
let animationSkipped = false, done = false, paused = false;
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
    await Promise.delay(3000); // Pause after intro so you can read it

    // Phase 1: Style the dock
    await writeTo(styleEl, styleText[1], 0, speed, true, 1);
    await Promise.delay(3000); // Pause to admire the dock

    // Phase 2: Show portfolio content
    await writeTo(workEl, workText, 0, speed, false, 1);
    createWorkBox();
    await Promise.delay(2000); // Pause to see the content

    // Phase 3: Style the markdown content beautifully
    await writeTo(styleEl, styleText[2], 0, speed, true, 1);
    await Promise.delay(1500);

    // Phase 4: Final polish
    await writeTo(styleEl, styleText[3], 0, speed, true, 1);
    await Promise.delay(2000); // Final pause

    // Add window controls after animation completes
    done = true;
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

  // Add window controls after animation
  setTimeout(() => addWindowControls(), 100);
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

    do {
      await Promise.delay(thisInterval);
    } while(paused);

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
  pauseEl = document.getElementById('pause-resume');
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

  pauseEl.addEventListener('click', function(e) {
    e.preventDefault();
    if (paused) {
      pauseEl.textContent = "Pause ||";
      paused = false;
    } else {
      pauseEl.textContent = "Resume >>";
      paused = true;
    }
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

  // Open funny gif window
  const openGif = document.getElementById('open-gif');
  if (openGif) {
    openGif.addEventListener('click', function(e) {
      e.preventDefault();
      createGifWindow();
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

    // Create draggable title bar overlay
    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar-draggable';
    windowEl.appendChild(titleBar);

    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'window-controls';

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'window-button close';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      windowEl.style.display = 'none';
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
    windowEl.appendChild(controls);

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
// Make a window draggable by its title bar (GPU-accelerated)
//
function makeWindowDraggable(windowEl, titleBar) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;
  let rafId = null;

  titleBar.addEventListener('mousedown', dragStart);

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

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

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

      windowEl.style.left = (startLeft + deltaX) + 'px';
      windowEl.style.top = (startTop + deltaY) + 'px';
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
}

//
// Make a window resizable (GPU-accelerated)
//
function makeWindowResizable(windowEl) {
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  windowEl.appendChild(resizeHandle);

  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  let rafId = null;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
    startHeight = parseInt(window.getComputedStyle(windowEl).height, 10);

    // Enable GPU acceleration
    windowEl.style.willChange = 'width, height';

    e.stopPropagation();
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    e.preventDefault();

    // Cancel previous frame if still pending
    if (rafId) cancelAnimationFrame(rafId);

    // Use requestAnimationFrame for smooth resizing
    rafId = requestAnimationFrame(() => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newWidth = startWidth + deltaX;
      const newHeight = startHeight + deltaY;

      // Set minimum size
      if (newWidth > 200) {
        windowEl.style.width = newWidth + 'px';
      }
      if (newHeight > 150) {
        windowEl.style.height = newHeight + 'px';
        windowEl.style.maxHeight = newHeight + 'px';
      }
    });
  });

  document.addEventListener('mouseup', () => {
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
  });
}

//
// Bring window to front when clicked
//
let highestZIndex = 1000;
function bringWindowToFront(windowEl) {
  highestZIndex++;
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
// Create a funny gif window
//
let gifWindow = null;
function createGifWindow() {
  // If window already exists, just show it
  if (gifWindow) {
    gifWindow.style.display = 'block';
    bringWindowToFront(gifWindow);
    return;
  }

  // Create new gif window
  gifWindow = document.createElement('pre');
  gifWindow.id = 'gif-window';
  gifWindow.innerHTML = `
    <div style="padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h2 style="color: #22d3ee; margin-bottom: 20px; font-family: 'Inter', sans-serif;">Need a break? 😄</h2>
      <iframe src="https://giphy.com/embed/13HgwGsXF0aiGY" width="480" height="270" frameBorder="0" class="giphy-embed" allowFullScreen style="border-radius: 8px;"></iframe>
      <p style="color: #a78bfa; margin-top: 16px; font-size: 14px;">Keep grinding! 💪</p>
    </div>
  `;

  // Style the gif window
  gifWindow.style.left = '25%';
  gifWindow.style.top = '20%';
  gifWindow.style.width = '550px';
  gifWindow.style.height = '450px';
  gifWindow.style.maxHeight = '450px';

  // Add to DOM
  document.getElementById('content').appendChild(gifWindow);

  // Add window controls
  setTimeout(() => {
    addWindowControls();
    bringWindowToFront(gifWindow);
  }, 100);
}
