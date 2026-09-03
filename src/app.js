import 'classlist-polyfill';
import Markdown from 'markdown';
const md = Markdown.markdown.toHTML;
import workText from 'raw-loader!./work.txt';
import headerHTML from 'raw-loader!./header.html';
let styleText = [0, 1, 2, 3].map((i) => require('raw-loader!./styles' + i + '.css').default);
import preStyles from 'raw-loader!./prestyles.css';
import writeChar, { flushBuffer, applySyntaxHighlighting } from './lib/writeChar';
import getPrefix from './lib/getPrefix';
import * as CONSTANTS from './constants';

// Modules
import { WindowManager } from './modules/windowManager';
import { AnimationDirector } from './modules/animationDirector';

// Globals
// The portfolio renders immediately by default. The original live-coding intro
// remains available via ?intro=1 without delaying first-time visitors.
const search = window.location.search;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const shouldPlayIntro = /[?&]intro=1\b/.test(search) && !prefersReducedMotion;
let style, styleEl, workEl, skipAnimationEl;
let browserPrefix;

window.animationSkipped = false; // Global flag for interruption

document.addEventListener("DOMContentLoaded", function () {
  getBrowserPrefix();
  populateHeader();
  getEls();
  createEventHandlers();

  // Start the show
  start();
});

async function start() {
  // Put the work first. The optional intro is an easter egg, not a gate.
  if (!shouldPlayIntro) {
    surprisinglyShortAttentionSpan();
    return;
  }

  try {
    await AnimationDirector.start({
      styleEl,
      workEl,
      styleText,
      workText,
      createWorkBox,
      showDock: showAllDockItems,
      addControls: finishPrimaryWindowSetup,
      isDev: false
    });
  } catch (e) {
    if (e.message === "SKIP IT") {
      surprisinglyShortAttentionSpan();
    } else {
      console.error(e);
    }
  }
}

function createWorkBox() {
  if (workEl.classList.contains('flipped')) return;
  workEl.innerHTML = '<div class="md">' + md(workText) + '</div>';
  workEl.classList.add('flipped');
  workEl.scrollTop = 0;

  // Mouse wheel scroll simplified
  require('mouse-wheel')(workEl, async function (dx, dy) {
    workEl.scrollTop += dy;
  }, true);
}

// Skips all the animations.
function surprisinglyShortAttentionSpan() {
  window.animationSkipped = true;
  const txt = styleText.join('\n');

  // The work-text animations are rough
  style.textContent = "#work-text * { " + browserPrefix + "transition: none; }";
  style.textContent += txt;

  // Fill the style pane with fully-highlighted CSS in one shot
  styleEl.innerHTML = applySyntaxHighlighting(txt);
  prepareStyleEditor();
  createWorkBox();

  showAllDockItems();

  setTimeout(finishPrimaryWindowSetup, CONSTANTS.WINDOW_CONTROLS_DELAY);
}

function finishPrimaryWindowSetup() {
  prepareStyleEditor();
  WindowManager.makeWindow(styleEl, 'Terminal | Source');
  WindowManager.makeWindow(workEl, 'Portfolio | Elko Lemiso');
  scrollPanesToTop();
}

// Show the top of the portfolio/terminal content after the intro settles,
// so the first thing a visitor sees is the name + project list, not a
// mid-scroll CSS snippet.
function scrollPanesToTop() {
  requestAnimationFrame(() => {
    if (workEl) workEl.scrollTop = 0;
    if (styleEl) styleEl.scrollTop = 0;
  });
}

function prepareStyleEditor() {
  if (styleEl.querySelector('.style-editor-surface')) return;

  const editor = document.createElement('code');
  editor.className = 'style-editor-surface';
  editor.contentEditable = true;
  editor.spellcheck = false;
  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-multiline', 'true');
  editor.setAttribute('aria-label', 'Editable CSS source');

  while (styleEl.firstChild) {
    editor.appendChild(styleEl.firstChild);
  }

  styleEl.contentEditable = false;
  styleEl.appendChild(editor);
}

function showAllDockItems() {
  document.querySelectorAll('.dock-item:not(#skip-animation)').forEach(item => {
    item.style.setProperty('display', 'flex', 'important');
  });
  document.querySelectorAll('.dock-separator').forEach(sep => {
    sep.style.setProperty('display', 'block', 'important');
  });
  if (skipAnimationEl) {
    skipAnimationEl.style.setProperty('display', 'none', 'important');
  }
}

function getBrowserPrefix() {
  browserPrefix = getPrefix();
  styleText = styleText.map(text => text.replace(/-webkit-/g, browserPrefix));
}

function getEls() {
  let preStyleEl = document.createElement('style');
  preStyleEl.textContent = preStyles;
  document.body.insertBefore(preStyleEl, document.body.firstChild);

  style = document.getElementById('style-tag');
  styleEl = document.getElementById('style-text');
  workEl = document.getElementById('work-text');
  skipAnimationEl = document.getElementById('skip-animation');
}

function populateHeader() {
  let header = document.getElementById('header');
  header.innerHTML = headerHTML;
}

function createEventHandlers() {
  styleEl.addEventListener('input', function () {
    const editor = styleEl.querySelector('.style-editor-surface');
    style.textContent = editor ? editor.textContent : styleEl.textContent;
  });

  if (skipAnimationEl) {
    skipAnimationEl.addEventListener('click', function (e) {
      e.preventDefault();
      window.animationSkipped = true;
      surprisinglyShortAttentionSpan();
    });
  }

  // Dock items
  const bindClick = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  };

  bindClick('reopen-terminal', () => {
    styleEl.style.display = 'block';
    WindowManager.bringToFront(styleEl);
    if (window.matchMedia('(max-width: 760px)').matches) {
      styleEl.scrollIntoView({
        behavior: 'auto',
        block: 'start'
      });
    }
  });

  bindClick('reopen-portfolio', () => {
    workEl.style.display = 'block';
    WindowManager.bringToFront(workEl);
    if (window.matchMedia('(max-width: 760px)').matches) {
      workEl.scrollIntoView({
        behavior: 'auto',
        block: 'start'
      });
    }
  });

  bindClick('open-jeffrey', () => WindowManager.createJeffreyWindow());
  bindClick('open-js-editor', () => WindowManager.createJSWindow());
  bindClick('open-html-editor', () => WindowManager.createHTMLWindow());
}
