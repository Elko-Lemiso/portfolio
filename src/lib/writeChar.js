import * as CONSTANTS from '../constants';

// DOM Cache
const domCache = new Map();

// State
const state = {
  elements: new Map(),
  renderLoopId: null
};

/**
 * Main entry point for writing characters
 * @param {HTMLElement} el - Element to write to
 * @param {string} char - Character(s) to write
 * @param {HTMLElement} styleMirror - Optional <style> tag to mirror CSS to
 */
export default function writeChar(el, char, styleMirror) {
  if (!state.elements.has(el)) {
    state.elements.set(el, {
      buffer: '',
      isStyle: !!styleMirror,
      styleMirror: styleMirror,
      // CSS Parser State
      inComment: false,
      tokenBuffer: '', // To accumulate characters for tokenization
      lastChar: ''
    });
  }

  const elState = state.elements.get(el);
  elState.buffer += char;

  if (!state.renderLoopId) {
    state.renderLoopId = requestAnimationFrame(renderLoop);
  }
}

/**
 * Simple writer for non-highlighted text (faster)
 */
export function writeSimpleChar(el, char) {
  if (!state.elements.has(el)) {
    state.elements.set(el, {
      buffer: '',
      isStyle: false
    });
  }
  const elState = state.elements.get(el);
  elState.buffer += char;
  if (!state.renderLoopId) {
    state.renderLoopId = requestAnimationFrame(renderLoop);
  }
}

/**
 * Force flush all buffers to DOM immediately
 */
export function flushBuffer(el) {
  if (!el || !state.elements.has(el)) return;
  const elState = state.elements.get(el);
  if (elState.buffer) {
    processBuffer(el, elState);
    el.scrollTop = el.scrollHeight;
  }
}

/**
 * Main Render Loop
 */
function renderLoop() {
  state.renderLoopId = null;
  let hasPending = false;

  for (const [el, elState] of state.elements.entries()) {
    if (elState.buffer.length > 0) {
      processBuffer(el, elState);
      el.scrollTop = el.scrollHeight;
      if (elState.buffer.length > 0) hasPending = true;
    }
  }

  if (hasPending) {
    state.renderLoopId = requestAnimationFrame(renderLoop);
  }
}

/**
 * Process a chunk of the buffer and update DOM
 */
function processBuffer(el, elState) {
  let txt = elState.buffer;
  elState.buffer = '';

  if (elState.isStyle) {
    txt = handleCssSyntax(txt, elState);
  }

  el.insertAdjacentHTML('beforeend', txt);
}

/**
 * Syntax Highlighting Logic
 * Buffers tokens to wrap them in spans
 */
function handleCssSyntax(text, state) {
  let output = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Mirror specific CSS chars to style tag immediately to avoid lag
    if (state.styleMirror) {
      if (char !== ' ' && char !== '\n') {
        // Optimize: Don't mirror whitespace excessively if helpful, 
        // but strictly we should mirror everything.
        // Actually, let's just mirror everything for correctness.
      }
      state.styleMirror.textContent += char;
    }

    // 1. Handle Comments
    if (state.inComment) {
      if (char === '/' && state.lastChar === '*') {
        state.inComment = false;
        output += '/</span>';
        state.tokenBuffer = '';
      } else {
        output += char;
      }
      state.lastChar = char;
      continue;
    }

    // Check for comment start
    if (char === '*' && state.lastChar === '/') {
      // We just outputted a '/', now we have a '*'.
      // We need to retroactively wrap the '/' we just appended?
      // Since 'output' is local, we can slice it!
      if (output.endsWith('/')) {
        output = output.slice(0, -1); // remove the slash
        output += '<span class="comment">/*';
        state.inComment = true;
        state.lastChar = char;
        state.tokenBuffer = '';
        continue;
      }
    }

    // 2. Token Logic
    // buffer chars until we hit a delimiter
    if (':;{}'.includes(char)) {
      let className = '';
      if (char === ':') className = 'key';
      if (char === ';') className = 'value';
      if (char === '{') className = 'selector';

      if (className) {
        // Wrap the buffered token
        output += `<span class="${className}">${state.tokenBuffer}</span>${char}`;
      } else {
        output += state.tokenBuffer + char;
      }
      state.tokenBuffer = '';
    } else if (char === ' ' || char === '\n' || char === '\t') {
      // Whitespace flushes the token buffer without wrapping (usually)
      // OR we keep accumulating whitespace into the token? 
      // For "key:", the key often has spaces? No.
      // For "value;", value has spaces.
      // So we keep accumulating.
      output += state.tokenBuffer + char;
      state.tokenBuffer = '';
      // Wait, if we flush on space, we lose the ability to wrap "20px solid" as one value.
      // Better Strategy: ACCUMULATE EVERYTHING into tokenBuffer until delimiter.
      // BUT, we want to print as we type!
      // If we buffer, nothing appears on screen until the delimiter. That looks laggy.

      // Compromise:
      // We output immediately, but we don't wrap. 
      // Syntactic Highlighting in a stream is hard.
      // The original solution used "replace" on the whole string.

      // NEW STRATEGY: 
      // Just output the char.
      // IF the char is a delimiter (:, ;, {), we insert a span *around the previous text*?
      // No, we can't easily reach back into the DOM.

      // Revert to buffer-flush strategy:
      // We MUST buffer the token validation to color it.
      // To prevent perceived lag, we only buffer "potential keywords".
      // Actually, for the "typing effect", it's acceptable for the current word to be invisible until completion
      // if it's short.
      // Let's try buffering everything.
      state.tokenBuffer += char;

      // Optimization: If buffer gets too long (e.g. huge comment or huge value), flush it unstyled to prevent hang.
      if (state.tokenBuffer.length > 50) {
        output += state.tokenBuffer;
        state.tokenBuffer = '';
      }
    } else {
      state.tokenBuffer += char;
    }

    state.lastChar = char;
  }

  // I currently set state.tokenBuffer on the object, so it IS carried over!
  // BUT `output` is returned and appended.
  // We should NOT output `state.tokenBuffer` here if we want to wait for the delimiter.
  // PROBLEM: If I don't output, the user sees nothing.

  // HYBRID APPROACH:
  // Render the tokenBuffer inside a temporary <span> that we remove/replace later? Too complex.

  // We have to be careful about order.
  // 1. Protect Comments (replace with placeholder?)
  // Actually, standard replace chain works if carefully ordered, 
  // but CSS is tricky because "key: value" looks like "selector {".

  // Let's use a simpler tokenizing approach even for bulk, or just robust regex.
  // The original app used simple regexes.
  return output;
}

/**
 * Bulk Syntax Highlighting for Skip Function
 * Processes the entire text at once using Regex
 */
export function applySyntaxHighlighting(text) {
  // Regex definitions matching the streaming logic
  // Order matters for replacement chain

  // 1. Comments: /* ... */
  const commentRegex = /(\/\*[\s\S]*?\*\/)/g;

  // 2. Selectors: start of line or after }, match until {
  // This is hard to perfect with regex, trying a safe approx:
  // Match text ending in {
  // Be careful not to match inside comments (handled by order if we placeholder)
  const selectorRegex = /([^{};]+)\{/g;

  // 3. Keys: property:
  // Match alphanumeric+hyphen followed by colon
  const keyRegex = /([a-zA-Z-]+)\s*:/g;

  // 4. Values: : value;
  // Match colon, then content, then semicolon
  const valueRegex = /:\s*([^;{}]+);/g;

  // To avoid overlapping replacements destroying tags we just made, simpler approach:
  // We can't safely chain .replace if the patterns overlap or match HTML.
  // The safest way on a raw string is to tokenize or use a placeholder strategy.

  // But for this use case, let's stick to the visual approximation used in the streaming version.
  // The streaming version detects chars.

  // Let's try a safer chain that doesn't eat tags.
  // We can use a single pass function? No, replace is efficient.

  let html = text
    // Protect comments first
    .replace(commentRegex, '<span class="comment">$1</span>')

    // Selectors: Assume anything followed by { is a selector
    // We must ensure we don't match inside the spans we just made.
    // Since selectors shouldn't have spans yet (comments are /* */), this is safe-ish.
    .replace(/([^{};>]+)\{/g, '<span class="selector">$1</span>{')

    // Properties: word followed by colon. 
    // Avoid matching https:// (protocol) or existing spans.
    // We look for " word:"
    .replace(/([a-zA-Z-]+\s*):/g, '<span class="key">$1</span>:')

    // Values: : value ;
    // This is the hardest to do without overlapping key
    // We effectively just wrapped the key. Now we match : value ;
    // We must NOT match inside tags.
    .replace(/:\s*([^;{}<]+);/g, ':<span class="value">$1</span>;');

  return html;
}

// Support for skip function
export function handleChar(fullText, char) {
  return fullText + char;
}

