import * as CONSTANTS from '../constants';
import { registerEventListener, cleanupEventListeners } from '../utils/eventRegistry';

/**
 * Window Manager Module
 * Handles creation, manipulation, and lifecycle of application windows
 */

let highestZIndex = CONSTANTS.Z_INDEX.BASE;
let jeffreyWindow = null;
let jsWindow = null;
let htmlWindow = null;

export const WindowManager = {
  /**
   * Add macOS window control buttons and dragging/resizing to an element
   * @param {HTMLElement} windowEl - The window element
   * @param {string} title - Window title
   */
  makeWindow: function (windowEl, title) {
    if (windowEl.hasAttribute('data-has-controls')) return;
    windowEl.setAttribute('data-has-controls', 'true');

    // Set up window for dragging
    windowEl.style.position = 'absolute';
    // Don't override existing style if already set

    // Create sticky header container
    const headerContainer = document.createElement('div');
    headerContainer.className = 'window-header-sticky';

    // Parts
    const titleBarBg = document.createElement('div');
    titleBarBg.className = 'window-titlebar-bg';

    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar-draggable';

    const windowTitle = document.createElement('div');
    windowTitle.className = 'window-title';
    windowTitle.textContent = title || 'Window';

    const controls = document.createElement('div');
    controls.className = 'window-controls';

    // Assemble header
    headerContainer.appendChild(titleBarBg);
    headerContainer.appendChild(titleBar);
    headerContainer.appendChild(windowTitle);
    headerContainer.appendChild(controls);

    // Insert before content
    windowEl.insertBefore(headerContainer, windowEl.firstChild);

    // Add buttons
    this.addWindowButtons(windowEl, controls, title);

    // Add dragging functionality
    this.makeDraggable(windowEl, titleBar);

    // Add resize functionality
    this.makeResizable(windowEl);

    // Add z-index management
    registerEventListener(windowEl, 'mousedown', () => this.bringToFront(windowEl));
  },

  addWindowButtons: function (windowEl, controls, title) {
    const windowName = title || 'window';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'window-button close';
    closeBtn.title = `Close ${windowName}`;
    closeBtn.setAttribute('aria-label', `Close ${windowName}`);
    registerEventListener(closeBtn, 'click', (e) => {
      e.stopPropagation();
      closeBtn.blur();
      windowEl.inert = true;
      windowEl.setAttribute('aria-hidden', 'true');
      windowEl.style.display = 'none';
      if (windowEl.id === 'jeffrey-window') {
        const video = windowEl.querySelector('video');
        if (video) video.pause();
      }
    });

    // Minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.type = 'button';
    minimizeBtn.className = 'window-button minimize';
    minimizeBtn.title = `Minimize ${windowName}`;
    minimizeBtn.setAttribute('aria-label', `Minimize ${windowName}`);
    registerEventListener(minimizeBtn, 'click', (e) => {
      e.stopPropagation();
      if (windowEl.classList.contains('minimized')) {
        // Restore
        windowEl.classList.remove('minimized');
        windowEl.inert = false;
        windowEl.removeAttribute('aria-hidden');
        windowEl.style.transform = 'none';
        windowEl.style.opacity = '1';
        this.bringToFront(windowEl);
      } else {
        // Minimize (Genie-ish effect)
        minimizeBtn.blur();
        windowEl.classList.add('minimized');
        const rect = windowEl.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const viewportW = window.innerWidth;

        // Target: Bottom center, small scale
        // Calculate translation needed to move center of window to center of bottom
        const translateY = viewportH - rect.top - 20;
        const translateX = (viewportW / 2) - (rect.left + rect.width / 2);

        windowEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.1)`;
        windowEl.style.opacity = '0';
        windowEl.inert = true;
        windowEl.setAttribute('aria-hidden', 'true');
      }
    });

    // Maximize button
    const maximizeBtn = document.createElement('button');
    maximizeBtn.type = 'button';
    maximizeBtn.className = 'window-button maximize';
    maximizeBtn.title = `Maximize ${windowName}`;
    maximizeBtn.setAttribute('aria-label', `Maximize ${windowName}`);
    registerEventListener(maximizeBtn, 'click', (e) => {
      e.stopPropagation();
      if (windowEl.classList.contains('maximized')) {
        // Restore
        const safeStyles = JSON.parse(windowEl.dataset.preMaxStyles || '{}');
        windowEl.style.left = safeStyles.left;
        windowEl.style.top = safeStyles.top;
        windowEl.style.width = safeStyles.width;
        windowEl.style.height = safeStyles.height;
        windowEl.classList.remove('maximized');
      } else {
        // Maximize
        windowEl.dataset.preMaxStyles = JSON.stringify({
          left: windowEl.style.left,
          top: windowEl.style.top,
          width: windowEl.style.width,
          height: windowEl.style.height
        });

        windowEl.classList.add('maximized');
        windowEl.style.left = '10px';
        windowEl.style.top = '10px';
        windowEl.style.width = 'calc(100vw - 20px)';
        windowEl.style.height = `calc(100vh - ${CONSTANTS.DOCK_HEIGHT + 20}px)`;
        this.bringToFront(windowEl);
      }
    });

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
  },

  makeDraggable: function (windowEl, titleBar) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    let rafId = null;

    const dragStart = (e) => {
      if (e.target.classList.contains('window-button')) return;
      isDragging = true;
      windowEl.classList.add('is-dragging'); // Disable transitions
      startX = e.clientX;
      startY = e.clientY;

      // Fix: Use offsetLeft/Top for robust relative positioning
      // This works perfectly because style.left is relative to the offsetParent
      // and offsetLeft is the current computed position relative to that same parent.
      startLeft = windowEl.offsetLeft;
      startTop = windowEl.offsetTop;

      windowEl.style.willChange = 'left, top';
      titleBar.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const drag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        // Bounds logic can remain similar, using offsetWidth of parent if needed
        // But for now, simple viewport bounds check on the values

        // Ensure we don't drag off top
        if (newTop < 0) newTop = 0;

        // Simple bounds to keep at least some part visible
        // We can rely on the fact that the parent (#content) is basically the viewport size

        windowEl.style.left = newLeft + 'px';
        windowEl.style.top = newTop + 'px';
        windowEl.style.transform = 'none';
      });
    };

    const dragEnd = () => {
      if (isDragging) {
        isDragging = false;
        windowEl.classList.remove('is-dragging'); // Re-enable transitions
        titleBar.style.cursor = 'grab';
        windowEl.style.willChange = 'auto';
        if (rafId) cancelAnimationFrame(rafId);
      }
    };

    registerEventListener(titleBar, 'mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
  },

  makeResizable: function (windowEl) {
    const directions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${dir}`;
      handle.style.cursor = `${dir}-resize`;
      handle.dataset.direction = dir;
      windowEl.appendChild(handle);

      this.initResizeHandle(windowEl, handle);
    });
  },

  initResizeHandle: function (windowEl, handle) {
    let isResizing = false;
    let startX, startY, startW, startH, startL, startT;
    let rafId = null;

    const resizeStart = (e) => {
      isResizing = true;
      windowEl.classList.add('is-resizing');
      startX = e.clientX;
      startY = e.clientY;
      const rect = windowEl.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      // We can use offsetLeft/Top here too for consistency if we are manipulating styles
      startL = windowEl.offsetLeft;
      startT = windowEl.offsetTop;

      windowEl.style.willChange = 'width, height, left, top';
      e.stopPropagation();
      e.preventDefault();
    };

    const resizeMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const dir = handle.dataset.direction;

        let newW = startW, newH = startH, newL = startL, newT = startT;

        if (dir.includes('e')) newW = startW + deltaX;
        if (dir.includes('w')) { newW = startW - deltaX; newL = startL + deltaX; }
        if (dir.includes('s')) newH = startH + deltaY;
        if (dir.includes('n')) { newH = startH - deltaY; newT = startT + deltaY; }

        // Min size checks
        if (newW < CONSTANTS.MIN_WINDOW_SIZE.WIDTH) newW = CONSTANTS.MIN_WINDOW_SIZE.WIDTH;
        if (newH < CONSTANTS.MIN_WINDOW_SIZE.HEIGHT) newH = CONSTANTS.MIN_WINDOW_SIZE.HEIGHT;

        windowEl.style.width = newW + 'px';
        windowEl.style.height = newH + 'px';
        if (dir.includes('w')) windowEl.style.left = newL + 'px';
        if (dir.includes('n')) windowEl.style.top = newT + 'px';
      });
    };

    const resizeEnd = () => {
      if (isResizing) {
        isResizing = false;
        windowEl.classList.remove('is-resizing');
        windowEl.style.willChange = 'auto';
        if (rafId) cancelAnimationFrame(rafId);
      }
    };

    registerEventListener(handle, 'mousedown', resizeStart);
    document.addEventListener('mousemove', resizeMove);
    document.addEventListener('mouseup', resizeEnd);
  },

  bringToFront: function (windowEl) {
    windowEl.inert = false;
    windowEl.removeAttribute('aria-hidden');

    // If minimized, restore it first
    if (windowEl.classList.contains('minimized')) {
      windowEl.classList.remove('minimized');
      windowEl.style.transform = 'none';
      windowEl.style.opacity = '1';
    }

    highestZIndex++;
    if (highestZIndex > CONSTANTS.Z_INDEX.MAX) {
      // Reset logic could go here, simplifying for now
      highestZIndex = CONSTANTS.Z_INDEX.BASE + 1;
      document.querySelectorAll('pre:not(:empty)').forEach(el => el.style.zIndex = CONSTANTS.Z_INDEX.BASE);
    }
    windowEl.style.zIndex = highestZIndex;
  },

  // Custom Window Creators

  createJeffreyWindow: function () {
    if (jeffreyWindow) {
      jeffreyWindow.style.display = 'block';
      this.bringToFront(jeffreyWindow);
      // Play video if paused
      const vid = jeffreyWindow.querySelector('video');
      if (vid) vid.play();
      return;
    }

    jeffreyWindow = document.createElement('pre');
    jeffreyWindow.id = 'jeffrey-window';
    // Use a clean structure with classes we can target in CSS
    jeffreyWindow.innerHTML = `
    <div class="glass-content-wrapper">
      <video autoplay loop muted playsinline class="jeffrey-video">
        <source src="/ico/jeffrey.webm" type="video/webm">
      </video>
    </div>`;

    // Apply basic positioning from config, but let CSS handle visual style
    Object.assign(jeffreyWindow.style, CONSTANTS.DEFAULT_WINDOW_CONFIG.JEFFREY);

    document.getElementById('content').appendChild(jeffreyWindow);
    // Add controls slightly delayed ensuring DOM presence
    setTimeout(() => {
      this.makeWindow(jeffreyWindow, 'Jeffrey — Film loop');
      this.bringToFront(jeffreyWindow);
    }, 0);
  },

  createJSWindow: function () {
    if (jsWindow) {
      jsWindow.style.display = 'block';
      this.bringToFront(jsWindow);
      return;
    }

    jsWindow = document.createElement('pre');
    jsWindow.id = 'js-window';
    jsWindow.className = 'editor-window';
    jsWindow.spellcheck = false;

    const codeEditor = document.createElement('code');
    codeEditor.className = 'editor-surface';
    codeEditor.contentEditable = true;
    codeEditor.spellcheck = false;
    codeEditor.setAttribute('role', 'textbox');
    codeEditor.setAttribute('aria-multiline', 'true');
    codeEditor.setAttribute('aria-label', 'JavaScript editor');
    codeEditor.textContent = `// Press Cmd/Ctrl + Enter to run
console.log("Hello from Elko's portfolio");
document.body.style.background = "#111111";`;
    jsWindow.appendChild(codeEditor);

    Object.assign(jsWindow.style, CONSTANTS.DEFAULT_WINDOW_CONFIG.JAVASCRIPT);

    // Add console output div
    const consoleOutput = document.createElement('div');
    consoleOutput.id = 'js-console';
    consoleOutput.setAttribute('aria-live', 'polite');
    jsWindow.appendChild(consoleOutput);

    document.getElementById('content').appendChild(jsWindow);

    // Key handler for execution
    registerEventListener(codeEditor, 'keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.executeJS(codeEditor.textContent, consoleOutput);
      }
    });

    setTimeout(() => {
      this.makeWindow(jsWindow, 'JavaScript Editor');
      this.bringToFront(jsWindow);
    }, 0);
  },

  executeJS: function (code, consoleEl) {
    // Simple scoped console mock
    const mockConsole = {
      log: (...args) => {
        const line = document.createElement('div');
        line.textContent = args.join(' ');
        line.style.color = '#ccc';
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
    };

    try {
      // Dangerous but cool for a portfolio site
      new Function('console', code)(mockConsole);
      mockConsole.log('✓ Executed');
    } catch (e) {
      mockConsole.log('✗ Error: ' + e.message);
    }
  },

  createHTMLWindow: function () {
    if (htmlWindow) {
      htmlWindow.style.display = 'block';
      this.bringToFront(htmlWindow);
      return;
    }

    htmlWindow = document.createElement('pre');
    htmlWindow.id = 'html-window';
    htmlWindow.className = 'editor-window';
    htmlWindow.spellcheck = false;

    const htmlEditor = document.createElement('code');
    htmlEditor.className = 'editor-surface';
    htmlEditor.contentEditable = true;
    htmlEditor.spellcheck = false;
    htmlEditor.setAttribute('role', 'textbox');
    htmlEditor.setAttribute('aria-multiline', 'true');
    htmlEditor.setAttribute('aria-label', 'HTML editor');
    htmlEditor.textContent = `<!-- Press Cmd/Ctrl + Enter to render -->\n<div>Hello World</div>`;
    htmlWindow.appendChild(htmlEditor);

    const preview = document.createElement('div');
    preview.className = 'html-preview';
    preview.setAttribute('role', 'region');
    preview.setAttribute('aria-live', 'polite');
    preview.setAttribute('aria-label', 'HTML preview');
    preview.innerHTML = '<div>Hello World</div>';
    htmlWindow.appendChild(preview);

    Object.assign(htmlWindow.style, CONSTANTS.DEFAULT_WINDOW_CONFIG.HTML);

    document.getElementById('content').appendChild(htmlWindow);

    registerEventListener(htmlEditor, 'keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        preview.innerHTML = htmlEditor.textContent;
      }
    });

    setTimeout(() => {
      this.makeWindow(htmlWindow, 'HTML Editor');
      this.bringToFront(htmlWindow);
    }, 0);
  }
};
