(() => {
  const root = document.querySelector('.terminal');
  if (!root) return;

  const pane = root.querySelector('.zx-view');
  const grid = root.querySelector('.zx-grid');
  const input = root.querySelector('#zx-input');
  const paperEl = root.querySelector('.zx-paper');
  const screenEl = root.querySelector('.zx-screen');
  const shellPane = root.querySelector('.terminal-shell');
  const shellInput = root.querySelector('#terminal-input');
  const titleEl = root.querySelector('[data-terminal-title]');
  const yearEl = root.querySelector('[data-terminal-year]');
  const canvas = root.querySelector('.zx-canvas');
  const modeButtons = Array.from(root.querySelectorAll('.t-mode'));
  if (!pane || !grid || !input || !paperEl || !screenEl || !canvas || !shellPane) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let data = {};
  try {
    data = JSON.parse(root.dataset.terminal || '{}');
  } catch {
    data = {};
  }
  const lang = data.lang === 'cs' ? 'cs' : 'en';
  const shellTitle = titleEl ? titleEl.textContent : 'SYSTEM / INDEX';
  const shellYear = yearEl ? yearEl.textContent : '';
  const shellAria = root.getAttribute('aria-label') || 'Interactive console';

  const COLS = 32;
  const ROWS = 24;
  const OUT_ROWS = 23;
  const BLACK = 0;
  const WHITE = 7;
  const PALETTE = ['#000000', '#0000d7', '#d70000', '#d700d7', '#00d700', '#00d7d7', '#d7d700', '#d7d7d7'];
  const BRIGHT = ['#000000', '#0000ff', '#ff0000', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ffffff'];
  const FUNCTIONS = new Set([
    'INT', 'ABS', 'SGN', 'SQR', 'SIN', 'COS', 'TAN', 'ATN', 'EXP', 'LN',
    'LEN', 'VAL', 'CHR$', 'CODE', 'STR$', 'PEEK',
  ]);
  const NAV_TOPICS = new Set([
    'SITES', 'APPS', 'TOOLS', 'WHOAMI', 'ABOUT', 'CONTACT', 'GITHUB', 'CV',
    'HELP', 'SHELL',
  ]);

  const TEXT = {
    en: {
      whoami: 'Ondra Linek — engineer. I build Go backends and native apps for Apple platforms, and I stay responsible for the result from idea to production.',
      about: [
        'I am a software engineer from Czechia. The last decade has been Go backends — internal platforms, onboarding, billing, support tooling and automation — and Apple apps in my own time.',
        'I take systems from idea to production and stay responsible for them: architecture, implementation, operation and the decisions in between. In the age of LLMs and agents, writing code is the easy part — knowing what to build, keeping it correct and standing behind it is the job.',
      ],
      contactNote: 'Open to collaboration, new projects and ideas worth building.',
      openHint: 'GOTO/OPEN <N> OR OPEN <NAME>',
      notFound: (query) => `NOT FOUND: ${query}`,
      multiple: 'MULTIPLE MATCHES',
      opening: (url) => `OPENING ${url}`,
      noLink: (name) => `NO LINK FOR ${name}`,
      usageOpen: 'USAGE: OPEN <NAME> OR OPEN <N>',
      usageCat: 'USAGE: CAT <NAME>',
      specific: 'BE MORE SPECIFIC',
      visit: (name) => `OPEN ${name} TO VISIT`,
      ls: ['SITES/  APPS/  TOOLS/', 'ABOUT  CONTACT  README', 'GOTO SITES TO START'],
    },
    cs: {
      whoami: 'Ondra Linek — inženýr. Stavím Go backendy a nativní aplikace pro platformy Apple a zůstávám odpovědný za výsledek od nápadu po provoz.',
      about: [
        'Jsem softwarový inženýr z Česka. Posledních deset let stavím backendy v Go — interní platformy, onboarding, billing, podpůrné nástroje a automatizaci — a ve volném čase nativní aplikace pro platformy Apple.',
        'Systémy beru od nápadu do provozu a zůstávám za ně odpovědný: architektura, implementace, provoz a rozhodnutí mezi tím. V éře LLM a agentů je psaní kódu ta snadná část — vědět, co postavit, udržet to správné a stát si za tím, je ta práce.',
      ],
      contactNote: 'Otevřený spolupráci, novým projektům a nápadům, které stojí za to postavit.',
      openHint: 'GOTO/OPEN <N> NEBO OPEN <JMENO>',
      notFound: (query) => `NENALEZENO: ${query}`,
      multiple: 'VICE SHOD',
      opening: (url) => `OTEVIRAM ${url}`,
      noLink: (name) => `BEZ ODKAZU: ${name}`,
      usageOpen: 'POUZITI: OPEN <JMENO> NEBO OPEN <N>',
      usageCat: 'POUZITI: CAT <JMENO>',
      specific: 'UPŘESNĚTE',
      visit: (name) => `OPEN ${name} PRO OTEVRENI`,
      ls: ['SITES/  APPS/  TOOLS/', 'ABOUT  CONTACT  README', 'GOTO SITES TO START'],
    },
  };
  const T = TEXT[lang];

  const PROJECTS = [];
  (data.sites || []).forEach((site) => {
    PROJECTS.push({
      kind: 'SITE',
      key: site.domain,
      label: site.domain,
      name: site.name,
      url: site.url,
      keys: [site.domain, site.name, site.url].filter(Boolean),
      lines: [site.domain, site.desc].filter(Boolean),
    });
  });
  (data.apps || []).forEach((app) => {
    const url = app.site || app.store || (app.repo ? `https://github.com/${app.repo}` : '');
    PROJECTS.push({
      kind: 'APP',
      key: app.name,
      label: app.name,
      name: app.name,
      url,
      keys: [app.id, app.name, app.site, app.repo, app.store].filter(Boolean),
      lines: [app.platforms, app.tagline, app.summary].filter(Boolean),
    });
  });
  (data.tools || []).forEach((tool) => {
    PROJECTS.push({
      kind: 'TOOL',
      key: tool.name,
      label: tool.name,
      name: tool.name,
      url: tool.repo ? `https://github.com/${tool.repo}` : '',
      keys: [tool.name, tool.repo].filter(Boolean),
      lines: [tool.lang, tool.desc].filter(Boolean),
    });
  });

  const cellEls = [];
  for (let i = 0; i < COLS * ROWS; i += 1) {
    const cell = document.createElement('span');
    cell.className = 'zx-cell';
    grid.appendChild(cell);
    cellEls.push(cell);
  }

  const blankCell = () => ({ ch: ' ', ink: WHITE, bright: 0, flash: 0, cursor: 0 });
  let screen = Array.from({ length: OUT_ROWS }, () => Array.from({ length: COLS }, blankCell));
  let promptRow = Array.from({ length: COLS }, blankCell);
  let cursor = { x: 0, y: 0 };
  let attrs = { ink: WHITE, paper: BLACK, bright: 0, flash: 0, border: WHITE };
  let program = new Map();
  let vars = new Map();
  let runState = null;
  let awaiting = null;
  let booted = false;
  let lastPlot = { x: 0, y: 0 };
  let lastList = [];
  let zxHistory = [];
  let zxHistIndex = 0;

  class BasicError extends Error {
    constructor(message) {
      super(message);
      this.basic = message;
    }
  }

  function fail(message) {
    throw new BasicError(message);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isTruthy(value) {
    return typeof value === 'string' ? value.length > 0 : Boolean(value);
  }

  function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
    fail('C Nonsense in BASIC');
  }

  function toInteger(value) {
    return Math.trunc(toNumber(value));
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) fail('6 Number too big');
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value * 1e6) / 1e6);
  }

  function colorNumber(value) {
    const n = toInteger(value);
    if (n < 0 || n > 7) fail('K Invalid colour');
    return n;
  }

  function flagNumber(value) {
    const n = toInteger(value);
    if (n !== 0 && n !== 1) fail('K Invalid colour');
    return n;
  }

  function formatError(error) {
    return error && error.basic ? error.basic : 'C Nonsense in BASIC';
  }

  // ---------------------------------------------------------- screen

  function renderCell(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    const cell = y === OUT_ROWS ? promptRow[x] : screen[y][x];
    const el = cellEls[y * COLS + x];
    let cls = `zx-cell zx-ink-${cell.ink}`;
    if (cell.bright) cls += ' zx-bright';
    if (cell.flash) cls += ' zx-flash';
    if (cell.cursor) cls += ' zx-cursor';
    if (el.className !== cls) el.className = cls;
    if (el.textContent !== cell.ch) el.textContent = cell.ch;
  }

  function renderScreen() {
    for (let y = 0; y < OUT_ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) renderCell(x, y);
    }
  }

  function renderPrompt() {
    for (let x = 0; x < COLS; x += 1) renderCell(x, OUT_ROWS);
  }

  function renderAll() {
    renderScreen();
    renderPrompt();
  }

  function setCell(x, y, ch, style) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    const a = style || attrs;
    const cell = {
      ch: ch || ' ',
      ink: a.ink,
      bright: a.bright ? 1 : 0,
      flash: a.flash ? 1 : 0,
      cursor: a.cursor ? 1 : 0,
    };
    if (y === OUT_ROWS) promptRow[x] = cell;
    else screen[y][x] = cell;
    renderCell(x, y);
  }

  function blankRows() {
    return Array.from({ length: OUT_ROWS }, () => Array.from({ length: COLS }, blankCell));
  }

  function clearOutput() {
    screen = blankRows();
    cursor = { x: 0, y: 0 };
    renderScreen();
  }

  function clearPrompt() {
    promptRow = Array.from({ length: COLS }, blankCell);
    renderPrompt();
  }

  function clearScreen() {
    clearOutput();
    ctx.clearRect(0, 0, 256, 192);
  }

  function scrollScreen() {
    screen.shift();
    screen.push(Array.from({ length: COLS }, blankCell));
    cursor.y = OUT_ROWS - 1;
    renderScreen();
  }

  function newline() {
    cursor.x = 0;
    cursor.y += 1;
    if (cursor.y >= OUT_ROWS) scrollScreen();
  }

  function writeChar(ch, style) {
    if (cursor.x >= COLS) {
      cursor.x = 0;
      newline();
    }
    setCell(cursor.x, cursor.y, ch, style);
    cursor.x += 1;
  }

  function printText(text, style, options) {
    const opts = options || {};
    const a = style || attrs;
    for (const ch of String(text)) {
      if (ch === '\n') {
        newline();
        continue;
      }
      writeChar(ch, a);
    }
    if (opts.newline) newline();
  }

  function printAt(x, y, text, style) {
    cursor.x = clamp(x, 0, COLS - 1);
    cursor.y = clamp(y, 0, OUT_ROWS - 1);
    printText(text, style, { newline: true });
  }

  function printLine(text, style) {
    printText(text, style, { newline: true });
  }

  function blankZXLine() {
    printLine('', attrs);
  }

  // --------------------------------------------------------- palette

  function applyPaper() {
    paperEl.dataset.paper = String(attrs.paper);
    paperEl.dataset.bright = attrs.bright ? '1' : '0';
  }

  function applyBorder() {
    screenEl.dataset.border = String(attrs.border);
  }

  function setAttrs(next) {
    attrs = { ...attrs, ...next };
    applyPaper();
    applyBorder();
  }

  function colorFor(ink, bright) {
    return bright ? BRIGHT[ink] : PALETTE[ink];
  }

  function paint(x, y, ink, bright) {
    if (x < 0 || x > 255 || y < 0 || y > 191) return;
    ctx.fillStyle = colorFor(ink, bright);
    ctx.fillRect(x, 191 - y, 1, 1);
  }

  function line(x0, y0, x1, y1, ink, bright) {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      paint(x, y, ink, bright);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  function circle(cx, cy, radius, ink, bright) {
    let x = radius;
    let y = 0;
    let err = 1 - x;
    while (x >= y) {
      paint(cx + x, cy + y, ink, bright);
      paint(cx + y, cy + x, ink, bright);
      paint(cx - y, cy + x, ink, bright);
      paint(cx - x, cy + y, ink, bright);
      paint(cx - x, cy - y, ink, bright);
      paint(cx - y, cy - x, ink, bright);
      paint(cx + y, cy - x, ink, bright);
      paint(cx + x, cy - y, ink, bright);
      y += 1;
      if (err < 0) {
        err += 2 * y + 1;
      } else {
        x -= 1;
        err += 2 * (y - x) + 1;
      }
    }
  }

  // ---------------------------------------------------------- input

  function renderInput() {
    const raw = input.value.toUpperCase();
    const shown = raw.length > 29 ? raw.slice(raw.length - 29) : raw;
    promptRow = Array.from({ length: COLS }, blankCell);
    setCell(0, OUT_ROWS, '©', { ink: WHITE, bright: 1, flash: 0, cursor: 0 });
    for (let i = 0; i < shown.length; i += 1) {
      setCell(2 + i, OUT_ROWS, shown[i], { ink: WHITE, bright: 1, flash: 0, cursor: 0 });
    }
    const quotes = (raw.match(/"/g) || []).length;
    const cursorX = Math.min(COLS - 1, 2 + shown.length);
    setCell(cursorX, OUT_ROWS, quotes % 2 ? 'L' : 'K', { ink: WHITE, bright: 1, flash: 0, cursor: 1 });
    for (let x = 0; x < COLS; x += 1) renderCell(x, OUT_ROWS);
  }

  function syncInput() {
    const pos = input.selectionStart || input.value.length;
    const upper = input.value.toUpperCase();
    if (upper !== input.value) {
      input.value = upper;
      try {
        input.setSelectionRange(pos, pos);
      } catch {
        /* ignore */
      }
    }
    renderInput();
  }

  function submitInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      renderInput();
      return;
    }
    if (zxHistory[zxHistory.length - 1] !== trimmed) zxHistory.push(trimmed);
    zxHistIndex = zxHistory.length;
    input.value = '';
    renderInput();
    if (awaiting) {
      completeInput(trimmed);
      return;
    }
    executeLine(trimmed);
  }

  input.addEventListener('input', syncInput);
  input.addEventListener('focus', renderInput);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const raw = input.value;
      input.value = '';
      submitInput(raw);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!zxHistory.length) return;
      zxHistIndex = Math.max(0, zxHistIndex - 1);
      input.value = zxHistory[zxHistIndex] || '';
      renderInput();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!zxHistory.length) return;
      zxHistIndex = Math.min(zxHistory.length, zxHistIndex + 1);
      input.value = zxHistory[zxHistIndex] || '';
      renderInput();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const value = input.value;
      if (!value || value.includes(' ')) return;
      const matches = ZX_KEYWORDS.filter((keyword) => keyword.startsWith(value.toUpperCase()));
      if (matches.length === 1) {
        input.value = matches[0] + ' ';
        renderInput();
      }
      return;
    }
    if (event.key.toLowerCase() === 'l' && event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      clearScreen();
      renderInput();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMode('shell');
    }
  });

  // --------------------------------------------------------- boot

  function bootZX() {
    if (booted) return;
    booted = true;
    attrs = { ink: WHITE, paper: BLACK, bright: 0, flash: 0, border: WHITE };
    applyPaper();
    applyBorder();
    clearScreen();
    printAt(1, 1, '© 1982 Sinclair Research Ltd', { ink: WHITE, bright: 1 });
    printAt(4, 3, 'ZX SPECTRUM 48K', { ink: 6, bright: 1 });
    printAt(4, 5, 'BASIC', { ink: 5, bright: 1 });
    printAt(0, 8, 'TYPE HELP FOR BASIC COMMANDS', { ink: WHITE });
    printAt(0, 9, 'LIST  RUN  NEW  CLS', { ink: WHITE });
    printAt(0, 10, 'GOTO SITES  APPS  TOOLS', { ink: 5 });
    printAt(0, 11, '10 PRINT "HELLO FROM 1982"', { ink: 6 });
    printAt(0, 12, '20 STOP', { ink: 6 });
    printAt(0, 14, 'LOAD "" FOR THE DEMO', { ink: 5 });
    printAt(0, 15, 'SHELL  RETURN TO CONSOLE', { ink: 7 });
    printAt(0, 16, 'OPEN <NAME> TO VISIT', { ink: 6 });
    cursor = { x: 0, y: 18 };
    renderPrompt();
    input.value = '';
    renderInput();
  }

  // ------------------------------------------------------- compiler

  function splitTopLevel(source, separator) {
    const parts = [];
    let start = 0;
    let quote = false;
    let depth = 0;
    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === '"') quote = !quote;
      else if (!quote) {
        if (ch === '(') depth += 1;
        else if (ch === ')') depth = Math.max(0, depth - 1);
        else if (ch === separator && depth === 0) {
          parts.push(source.slice(start, i));
          start = i + 1;
        }
      }
    }
    parts.push(source.slice(start));
    return parts;
  }

  function findTopLevelKeyword(source, keyword) {
    let quote = false;
    let depth = 0;
    const upper = source.toUpperCase();
    const target = keyword.toUpperCase();
    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === '"') {
        quote = !quote;
        continue;
      }
      if (quote) continue;
      if (ch === '(') {
        depth += 1;
        continue;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        continue;
      }
      if (depth !== 0) continue;
      if (upper.slice(i, i + target.length) !== target) continue;
      const before = i === 0 ? ' ' : upper[i - 1];
      const after = i + target.length >= source.length ? ' ' : upper[i + target.length];
      if (!/[A-Z0-9$]/.test(before) && !/[A-Z0-9$]/.test(after)) return i;
    }
    return -1;
  }

  function parseExpr(source) {
    const src = String(source || '').trim();
    if (!src) fail('C Nonsense in BASIC');
    const tokens = lex(src);
    let pos = 0;

    function peek() {
      return tokens[pos];
    }

    function next() {
      return tokens[pos++];
    }

    function take(op) {
      const token = peek();
      if (token && token.t === 'op' && token.v === op) {
        pos += 1;
        return true;
      }
      return false;
    }

    function parseOr() {
      let left = parseAnd();
      while (peek() && peek().t === 'id' && peek().v === 'OR') {
        next();
        left = { type: 'bin', op: 'OR', left, right: parseAnd() };
      }
      return left;
    }

    function parseAnd() {
      let left = parseNot();
      while (peek() && peek().t === 'id' && peek().v === 'AND') {
        next();
        left = { type: 'bin', op: 'AND', left, right: parseNot() };
      }
      return left;
    }

    function parseNot() {
      const token = peek();
      if (token && token.t === 'id' && token.v === 'NOT') {
        next();
        return { type: 'un', op: 'NOT', value: parseNot() };
      }
      return parseCompare();
    }

    function parseCompare() {
      let left = parseAdd();
      for (;;) {
        const token = peek();
        if (!token || token.t !== 'op' || !['<', '>', '=', '<=', '>=', '<>'].includes(token.v)) break;
        next();
        left = { type: 'bin', op: token.v, left, right: parseAdd() };
      }
      return left;
    }

    function parseAdd() {
      let left = parseMul();
      for (;;) {
        const token = peek();
        if (!token || token.t !== 'op' || !['+', '-'].includes(token.v)) break;
        next();
        left = { type: 'bin', op: token.v, left, right: parseMul() };
      }
      return left;
    }

    function parseMul() {
      let left = parsePow();
      for (;;) {
        const token = peek();
        if (!token || token.t !== 'op' || !['*', '/'].includes(token.v)) break;
        next();
        left = { type: 'bin', op: token.v, left, right: parsePow() };
      }
      return left;
    }

    function parsePow() {
      const left = parseUnary();
      if (peek() && peek().t === 'op' && peek().v === '^') {
        next();
        return { type: 'bin', op: '^', left, right: parsePow() };
      }
      return left;
    }

    function parseUnary() {
      const token = peek();
      if (token && token.t === 'op' && (token.v === '-' || token.v === '+')) {
        next();
        return { type: 'un', op: token.v, value: parseUnary() };
      }
      return parsePrimary();
    }

    function parsePrimary() {
      const token = next();
      if (!token) fail('C Nonsense in BASIC');
      if (token.t === 'num') return { type: 'num', value: token.v };
      if (token.t === 'str') return { type: 'str', value: token.v };
      if (token.t === 'op' && token.v === '(') {
        const expr = parseOr();
        if (!take(')')) fail('C Nonsense in BASIC');
        return expr;
      }
      if (token.t === 'id') {
        const name = token.v;
        if (peek() && peek().t === 'op' && peek().v === '(') {
          next();
          const args = [];
          if (!(peek() && peek().t === 'op' && peek().v === ')')) {
            args.push(parseOr());
            while (take(',')) args.push(parseOr());
          }
          if (!take(')')) fail('C Nonsense in BASIC');
          return { type: 'call', name, args };
        }
        if (name === 'PI') return { type: 'num', value: Math.PI };
        if (name === 'RND' || name === 'INKEY$') return { type: 'call', name, args: [] };
        if (FUNCTIONS.has(name)) return { type: 'call', name, args: [parseUnary()] };
        return { type: 'var', name };
      }
      fail('C Nonsense in BASIC');
      return { type: 'num', value: 0 };
    }

    const result = parseOr();
    if (pos < tokens.length) fail('C Nonsense in BASIC');
    return result;
  }

  function lex(source) {
    const tokens = [];
    let i = 0;
    const isDigit = (ch) => ch >= '0' && ch <= '9';
    const isAlpha = (ch) => /[A-Za-z]/.test(ch);
    while (i < source.length) {
      const ch = source[i];
      if (ch === ' ' || ch === '\t') {
        i += 1;
        continue;
      }
      if (ch === '"') {
        i += 1;
        let value = '';
        let closed = false;
        while (i < source.length) {
          if (source[i] === '"') {
            if (source[i + 1] === '"') {
              value += '"';
              i += 2;
              continue;
            }
            i += 1;
            closed = true;
            break;
          }
          value += source[i];
          i += 1;
        }
        if (!closed) fail('C Nonsense in BASIC');
        tokens.push({ t: 'str', v: value });
        continue;
      }
      if (isDigit(ch) || (ch === '.' && isDigit(source[i + 1]))) {
        let j = i;
        while (j < source.length && (isDigit(source[j]) || source[j] === '.')) j += 1;
        tokens.push({ t: 'num', v: Number(source.slice(i, j)) });
        i = j;
        continue;
      }
      if (isAlpha(ch)) {
        let j = i;
        while (j < source.length && (isAlpha(source[j]) || isDigit(source[j]) || source[j] === '$')) j += 1;
        tokens.push({ t: 'id', v: source.slice(i, j).toUpperCase() });
        i = j;
        continue;
      }
      if (ch === '<' || ch === '>' || ch === '=') {
        let op = ch;
        i += 1;
        if (source[i] === '=' && (ch === '<' || ch === '>')) {
          op += '=';
          i += 1;
        } else if (source[i] === '>' && ch === '<') {
          op = '<>';
          i += 1;
        }
        tokens.push({ t: 'op', v: op });
        continue;
      }
      if ('+-*/^(),'.includes(ch)) {
        tokens.push({ t: 'op', v: ch });
        i += 1;
        continue;
      }
      fail('C Nonsense in BASIC');
    }
    return tokens;
  }

  function evalExpr(node) {
    if (!node) fail('C Nonsense in BASIC');
    switch (node.type) {
      case 'num':
        return node.value;
      case 'str':
        return node.value;
      case 'var': {
        if (!vars.has(node.name)) return node.name.endsWith('$') ? '' : 0;
        return vars.get(node.name);
      }
      case 'un': {
        if (node.op === 'NOT') return isTruthy(evalExpr(node.value)) ? 0 : 1;
        const value = toNumber(evalExpr(node.value));
        return node.op === '-' ? -value : value;
      }
      case 'bin': {
        if (node.op === 'AND') return isTruthy(evalExpr(node.left)) && isTruthy(evalExpr(node.right)) ? 1 : 0;
        if (node.op === 'OR') return isTruthy(evalExpr(node.left)) || isTruthy(evalExpr(node.right)) ? 1 : 0;
        const left = evalExpr(node.left);
        const right = evalExpr(node.right);
        if (node.op === '+') {
          if (typeof left === 'string' && typeof right === 'string') return left + right;
          return toNumber(left) + toNumber(right);
        }
        if (node.op === '-') return toNumber(left) - toNumber(right);
        if (node.op === '*') return toNumber(left) * toNumber(right);
        if (node.op === '/') {
          const divisor = toNumber(right);
          if (divisor === 0) fail('Q Parameter error');
          return toNumber(left) / divisor;
        }
        if (node.op === '^') return toNumber(left) ** toNumber(right);
        if (['<', '>', '=', '<=', '>=', '<>'].includes(node.op)) {
          const a = typeof left === 'string' && typeof right === 'string' ? left : toNumber(left);
          const b = typeof left === 'string' && typeof right === 'string' ? right : toNumber(right);
          let result = false;
          if (node.op === '<') result = a < b;
          else if (node.op === '>') result = a > b;
          else if (node.op === '=') result = a === b;
          else if (node.op === '<=') result = a <= b;
          else if (node.op === '>=') result = a >= b;
          else result = a !== b;
          return result ? 1 : 0;
        }
        fail('C Nonsense in BASIC');
        return 0;
      }
      case 'call': {
        const args = node.args.map((arg) => evalExpr(arg));
        switch (node.name) {
          case 'PI':
            return Math.PI;
          case 'RND':
            return Math.random();
          case 'INKEY$':
            return '';
          case 'INT':
            return Math.floor(toNumber(args[0]));
          case 'ABS':
            return Math.abs(toNumber(args[0]));
          case 'SGN':
            return Math.sign(toNumber(args[0]));
          case 'SQR':
            return Math.sqrt(toNumber(args[0]));
          case 'SIN':
            return Math.sin(toNumber(args[0]));
          case 'COS':
            return Math.cos(toNumber(args[0]));
          case 'TAN':
            return Math.tan(toNumber(args[0]));
          case 'ATN':
            return Math.atan(toNumber(args[0]));
          case 'EXP':
            return Math.exp(toNumber(args[0]));
          case 'LN':
            return Math.log(toNumber(args[0]));
          case 'LEN':
            return String(args[0] === undefined ? '' : args[0]).length;
          case 'VAL':
            return Number(args[0]);
          case 'CHR$':
            return String.fromCharCode(toInteger(args[0]));
          case 'CODE':
            return String(args[0] === undefined ? '' : args[0]).charCodeAt(0) || 0;
          case 'STR$':
            return formatNumber(toNumber(args[0]));
          case 'PEEK':
            return 0;
          default:
            fail('C Nonsense in BASIC');
            return 0;
        }
      }
      default:
        fail('C Nonsense in BASIC');
        return 0;
    }
  }

  function normalizeQuery(value) {
    return String(value || '').toLowerCase().replace(/^["']|["']$/g, '').replace(/\/+$/, '').trim();
  }

  function findProjects(query) {
    const term = normalizeQuery(query);
    if (!term || /^\d+$/.test(term)) return [];
    const exact = PROJECTS.filter((project) => project.keys.some((key) => normalizeQuery(key) === term));
    if (exact.length) return exact;
    return PROJECTS.filter((project) => project.keys.some((key) => normalizeQuery(key).includes(term)));
  }

  function showMatches(matches) {
    lastList = matches;
    clearScreen();
    printLine(T.multiple, { ink: 6, bright: 1 });
    matches.slice(0, 10).forEach((project, index) => {
      printLine(`${index + 1} ${project.label.toUpperCase()}`, attrs);
    });
    printLine(T.specific, { ink: 5 });
    printLine(T.openHint, { ink: 5 });
  }

  function showList(kind) {
    const list = PROJECTS.filter((project) => project.kind === kind);
    lastList = list;
    clearScreen();
    printLine(`${kind}S`, { ink: 6, bright: 1 });
    list.forEach((project, index) => {
      printLine(`${index + 1} ${project.label.toUpperCase()}`, attrs);
    });
    blankZXLine();
    printLine(T.openHint, { ink: 5 });
  }

  function showProject(query) {
    const matches = findProjects(query);
    if (!matches.length) {
      zxError(T.notFound(query));
      return;
    }
    if (matches.length > 1) {
      showMatches(matches);
      return;
    }
    const project = matches[0];
    lastList = [project];
    clearScreen();
    printLine(project.name.toUpperCase(), { ink: 6, bright: 1 });
    printLine(project.kind, { ink: 5 });
    project.lines.forEach((text) => printLine(text, attrs));
    if (project.url) printLine(project.url, { ink: 5 });
    printLine(T.visit(project.label.toUpperCase()), { ink: 6 });
  }

  function openUrl(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function showOpen(query) {
    const text = String(query || '').trim();
    if (!text) {
      zxError(T.usageOpen);
      return;
    }
    let matches = [];
    if (/^\d+$/.test(text) && lastList.length) {
      const index = Number(text) - 1;
      if (index >= 0 && index < lastList.length) matches = [lastList[index]];
    }
    if (!matches.length) matches = findProjects(text);
    if (!matches.length) {
      zxError(T.notFound(text));
      return;
    }
    if (matches.length > 1) {
      showMatches(matches);
      return;
    }
    const project = matches[0];
    if (!project.url) {
      zxError(T.noLink(project.label));
      return;
    }
    printLine(T.opening(project.url), { ink: 5 });
    printLine(`OPEN ${project.label.toUpperCase()}`, attrs);
    openUrl(project.url);
  }

  function showWhoami(full) {
    clearScreen();
    printLine('ONDRA LINEK', { ink: 6, bright: 1 });
    printLine(T.whoami, attrs);
    blankZXLine();
    if (full) {
      T.about.forEach((paragraph) => {
        printLine(paragraph, attrs);
        blankZXLine();
      });
    }
    printLine('STACK  GO · SQL · CLOUD · LLM', { ink: 5 });
  }

  function showContact() {
    const links = data.links || {};
    clearScreen();
    printLine('CONTACT', { ink: 6, bright: 1 });
    if (links.email) printLine(`EMAIL   ${links.email}`, attrs);
    if (links.github) printLine(`GITHUB  ${links.github.replace(/^https?:\/\//, '')}`, attrs);
    if (links.cv) printLine(`CV      ${links.cv.replace(/^https?:\/\//, '').replace(/\/$/, '')}`, attrs);
    blankZXLine();
    printLine(T.contactNote, { ink: 5 });
  }

  function showGithub() {
    const url = data.links && data.links.github;
    if (!url) {
      zxError(T.noLink('GITHUB'));
      return;
    }
    printLine(T.opening(url), { ink: 5 });
    openUrl(url);
  }

  function showCv() {
    const url = data.links && data.links.cv;
    if (!url) {
      zxError(T.noLink('CV'));
      return;
    }
    printLine(T.opening(url), { ink: 5 });
    openUrl(url);
  }

  function showLs() {
    lastList = PROJECTS;
    clearScreen();
    printLine('~', { ink: 6, bright: 1 });
    T.ls.forEach((text) => printLine(text, attrs));
  }

  function showTree() {
    lastList = PROJECTS;
    clearScreen();
    printLine('~', { ink: 6, bright: 1 });
    ['SITE', 'APP', 'TOOL'].forEach((kind) => {
      printLine(`${kind}S`, { ink: 5 });
      PROJECTS.filter((project) => project.kind === kind).forEach((project) => {
        printLine(`  ${project.label.toUpperCase()}`, attrs);
      });
    });
    printLine('ABOUT  CONTACT  README', { ink: 5 });
  }

  function showNav(target) {
    const key = String(target || '').trim().toUpperCase();
    if (key === 'SITES') {
      showList('SITE');
      return;
    }
    if (key === 'APPS') {
      showList('APP');
      return;
    }
    if (key === 'TOOLS') {
      showList('TOOL');
      return;
    }
    if (key === 'WHOAMI') {
      showWhoami(false);
      return;
    }
    if (key === 'ABOUT') {
      showWhoami(true);
      return;
    }
    if (key === 'CONTACT') {
      showContact();
      return;
    }
    if (key === 'GITHUB') {
      showGithub();
      return;
    }
    if (key === 'CV') {
      showCv();
      return;
    }
    if (key === 'HELP') {
      showHelp();
      return;
    }
    if (key === 'SHELL') {
      setMode('shell');
      return;
    }
    showProject(target);
  }

  function compileGoto(source) {
    const text = String(source || '').trim();
    if (!text) fail('C Nonsense in BASIC');
    if (/^".*"$/.test(text)) return { type: 'nav', target: text.slice(1, -1) };
    if (/^\d+$/.test(text)) return { type: 'goto', target: parseExpr(text) };
    const upper = text.toUpperCase();
    if (NAV_TOPICS.has(upper)) return { type: 'nav', target: text };
    if (findProjects(text).length) return { type: 'nav', target: text };
    if (/^[A-Z][A-Z0-9 ]*$/.test(upper) && text.length > 1) return { type: 'nav', target: text };
    return { type: 'goto', target: parseExpr(text) };
  }

  function compilePrint(source) {
    const raw = String(source || '').trim();
    if (!raw) return { type: 'print', items: [] };
    const items = [];
    let buffer = '';
    let quote = false;
    let depth = 0;
    const push = (sep) => {
      const text = buffer.trim();
      buffer = '';
      if (!text && sep === null) return;
      let item;
      if (/^AT\b/i.test(text)) {
        const args = splitTopLevel(text.replace(/^AT\b/i, ''), ',');
        if (args.length !== 2) fail('C Nonsense in BASIC');
        item = { type: 'at', x: parseExpr(args[0]), y: parseExpr(args[1]) };
      } else if (/^TAB\b/i.test(text)) {
        item = { type: 'tab', value: parseExpr(text.replace(/^TAB\b/i, '')) };
      } else if (/^(INK|PAPER|BRIGHT|FLASH)\b/i.test(text)) {
        const match = text.match(/^(INK|PAPER|BRIGHT|FLASH)\b/i);
        item = { type: 'control', name: match[1].toUpperCase(), value: parseExpr(text.slice(match[0].length)) };
      } else if (text) {
        item = { type: 'expr', value: parseExpr(text) };
      } else {
        item = { type: 'nothing' };
      }
      item.sep = sep;
      items.push(item);
    };
    for (let i = 0; i < raw.length; i += 1) {
      const ch = raw[i];
      if (ch === '"') quote = !quote;
      if (!quote) {
        if (ch === '(') depth += 1;
        else if (ch === ')') depth = Math.max(0, depth - 1);
        else if (depth === 0 && (ch === ';' || ch === ',')) {
          if (ch === ',' && /^AT\b/i.test(buffer.trim()) && !buffer.includes(',')) {
            buffer += ch;
            continue;
          }
          push(ch);
          continue;
        }
      }
      buffer += ch;
    }
    push(null);
    return { type: 'print', items };
  }

  function compileIf(source) {
    const body = source.replace(/^IF\b/i, '').trim();
    const thenIndex = findTopLevelKeyword(body, 'THEN');
    if (thenIndex < 0) fail('C Nonsense in BASIC');
    const cond = parseExpr(body.slice(0, thenIndex));
    let rest = body.slice(thenIndex + 4).trim();
    let elseSource = '';
    const elseIndex = findTopLevelKeyword(rest, 'ELSE');
    if (elseIndex >= 0) {
      elseSource = rest.slice(elseIndex + 4).trim();
      rest = rest.slice(0, elseIndex).trim();
    }
    const compileBranch = (text) => {
      if (!text) return [];
      if (/^\d+$/.test(text)) return [{ type: 'goto', target: { type: 'num', value: Number(text) } }];
      return compileStatements(text);
    };
    return { type: 'if', cond, thenBlock: compileBranch(rest), elseBlock: compileBranch(elseSource) };
  }

  function compileFor(source) {
    const eq = findTopLevelChar(source, '=');
    if (eq < 0) fail('C Nonsense in BASIC');
    const name = source.slice(0, eq).trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9]*$/.test(name)) fail('C Nonsense in BASIC');
    const rest = source.slice(eq + 1);
    const toIndex = findTopLevelKeyword(rest, 'TO');
    if (toIndex < 0) fail('C Nonsense in BASIC');
    const start = parseExpr(rest.slice(0, toIndex));
    let tail = rest.slice(toIndex + 2);
    let stepSource = '1';
    const stepIndex = findTopLevelKeyword(tail, 'STEP');
    if (stepIndex >= 0) {
      stepSource = tail.slice(stepIndex + 4);
      tail = tail.slice(0, stepIndex);
    }
    return { type: 'for', name, start, end: parseExpr(tail), step: parseExpr(stepSource) };
  }

  function findTopLevelChar(source, char) {
    let quote = false;
    let depth = 0;
    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === '"') quote = !quote;
      else if (!quote) {
        if (ch === '(') depth += 1;
        else if (ch === ')') depth = Math.max(0, depth - 1);
        else if (ch === char && depth === 0) return i;
      }
    }
    return -1;
  }

  function compileInput(source) {
    const text = String(source || '').trim();
    if (!text) fail('C Nonsense in BASIC');
    const withPrompt = text.match(/^("(?:[^"]|"")*")\s*([;,])?\s*([A-Z][A-Z0-9]*\$?)$/i);
    if (withPrompt) {
      return {
        type: 'input',
        prompt: parseExpr(withPrompt[1]),
        separator: withPrompt[2] || null,
        name: withPrompt[3].toUpperCase(),
      };
    }
    const plain = text.match(/^([A-Z][A-Z0-9]*\$?)$/i);
    if (!plain) fail('C Nonsense in BASIC');
    return { type: 'input', prompt: null, separator: null, name: plain[1].toUpperCase() };
  }

  function compileLet(source) {
    const eq = findTopLevelChar(source, '=');
    if (eq < 0) fail('C Nonsense in BASIC');
    const name = source.slice(0, eq).trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9]*\$?$/.test(name)) fail('C Nonsense in BASIC');
    return { type: 'let', name, value: parseExpr(source.slice(eq + 1)) };
  }

  function compileStatement(source) {
    const text = String(source || '').trim();
    if (!text) return { type: 'nothing' };
    const upper = text.toUpperCase();
    if (upper.startsWith('REM')) return { type: 'nothing' };
    if (upper === 'CLS') return { type: 'cls' };
    if (upper === 'NEW') return { type: 'new' };
    if (upper === 'RUN') return { type: 'run' };
    if (upper === 'LIST') return { type: 'list' };
    if (upper === 'CLEAR') return { type: 'clear' };
    if (upper === 'STOP') return { type: 'stop' };
    if (upper === 'SHELL') return { type: 'shell' };
    if (upper === 'HELP') return { type: 'help' };
    if (upper === 'BEEP') return { type: 'nothing' };
    if (upper === 'PAUSE' || upper.startsWith('PAUSE ')) {
      return { type: 'nothing' };
    }
    if (upper.startsWith('LOAD')) return { type: 'load' };
    if (upper.startsWith('SAVE')) return { type: 'save' };
    if (upper.startsWith('PRINT')) return compilePrint(text.slice(5));
    if (upper.startsWith('LET')) return compileLet(text.slice(3));
    if (upper.startsWith('IF ')) return compileIf(text);
    if (upper.startsWith('FOR ')) return compileFor(text.slice(3));
    if (upper.startsWith('NEXT')) {
      const name = text.slice(4).trim().toUpperCase();
      if (name && !/^[A-Z][A-Z0-9]*$/.test(name)) fail('C Nonsense in BASIC');
      return { type: 'next', name: name || null };
    }
    if (upper.startsWith('GO TO')) return compileGoto(text.slice(5));
    if (upper.startsWith('GOTO')) return compileGoto(text.slice(4));
    if (upper.startsWith('GOSUB')) return { type: 'gosub', target: parseExpr(text.slice(5)) };
    if (upper === 'RETURN') return { type: 'return' };
    if (upper.startsWith('INPUT')) return compileInput(text.slice(5));
    if (upper.startsWith('BORDER')) return { type: 'color', name: 'border', value: parseExpr(text.slice(6)) };
    if (upper.startsWith('PAPER')) return { type: 'color', name: 'paper', value: parseExpr(text.slice(5)) };
    if (upper.startsWith('INK')) return { type: 'color', name: 'ink', value: parseExpr(text.slice(3)) };
    if (upper.startsWith('BRIGHT')) return { type: 'color', name: 'bright', value: parseExpr(text.slice(6)) };
    if (upper.startsWith('FLASH')) return { type: 'color', name: 'flash', value: parseExpr(text.slice(5)) };
    if (upper.startsWith('PLOT')) {
      const args = splitTopLevel(text.slice(4), ',');
      if (args.length !== 2) fail('C Nonsense in BASIC');
      return { type: 'plot', x: parseExpr(args[0]), y: parseExpr(args[1]) };
    }
    if (upper.startsWith('DRAW')) {
      const args = splitTopLevel(text.slice(4), ',');
      if (args.length !== 2) fail('C Nonsense in BASIC');
      return { type: 'draw', x: parseExpr(args[0]), y: parseExpr(args[1]) };
    }
    if (upper.startsWith('CIRCLE')) return { type: 'circle', radius: parseExpr(text.slice(6)) };
    if (upper.startsWith('RANDOMIZE')) return { type: 'nothing' };
    if (upper === 'SITES' || upper === 'APPS' || upper === 'TOOLS') {
      return { type: 'nav', target: upper };
    }
    if (upper === 'WHOAMI' || upper === 'ABOUT' || upper === 'CONTACT' || upper === 'GITHUB' || upper === 'CV') {
      return { type: 'nav', target: upper };
    }
    if (upper === 'LS' || upper === 'DIR') return { type: 'ls' };
    if (upper.startsWith('LS ')) return { type: 'nav', target: text.slice(3).trim() };
    if (upper === 'TREE') return { type: 'tree' };
    if (upper === 'OPEN') return { type: 'open', target: '' };
    if (upper.startsWith('OPEN ')) return { type: 'open', target: text.slice(5).trim() };
    if (upper === 'CAT') return { type: 'cat', target: '' };
    if (upper.startsWith('CAT ')) return { type: 'cat', target: text.slice(4).trim() };
    const eq = findTopLevelChar(text, '=');
    if (eq > 0) return compileLet(text);
    fail('C Nonsense in BASIC');
    return { type: 'nothing' };
  }

  function compileStatements(source) {
    const raw = String(source || '').trim();
    if (!raw) return [];
    const parts = splitTopLevel(raw, ':');
    const statements = [];
    for (let i = 0; i < parts.length; i += 1) {
      const segment = parts[i].trim();
      if (!segment) continue;
      if (/^IF\b/i.test(segment)) {
        statements.push(compileIf(parts.slice(i).join(':').trim()));
        break;
      }
      if (/^ELSE\b/i.test(segment)) fail('C Nonsense in BASIC');
      statements.push(compileStatement(segment));
    }
    return statements;
  }

  // -------------------------------------------------------- execution

  function printValue(value, style) {
    if (typeof value === 'string') printText(value, style, { newline: false });
    else printText(formatNumber(toNumber(value)), style, { newline: false });
  }

  function execPrint(statement) {
    const style = { ...attrs };
    const items = statement.items || [];
    if (!items.length) {
      newline();
      return;
    }
    for (const item of items) {
      if (item.type === 'at') {
        const row = toInteger(evalExpr(item.x));
        const col = toInteger(evalExpr(item.y));
        if (row < 0 || row >= OUT_ROWS || col < 0 || col >= COLS) fail('5 Out of screen');
        cursor.x = col;
        cursor.y = row;
      } else if (item.type === 'tab') {
        const next = toInteger(evalExpr(item.value));
        if (next < 0 || next >= COLS) fail('5 Out of screen');
        if (next < cursor.x) newline();
        cursor.x = next;
      } else if (item.type === 'control') {
        if (item.name === 'INK') style.ink = colorNumber(evalExpr(item.value));
        else if (item.name === 'PAPER') {
          attrs.paper = colorNumber(evalExpr(item.value));
          applyPaper();
        } else if (item.name === 'BRIGHT') {
          style.bright = flagNumber(evalExpr(item.value));
          attrs.bright = style.bright;
          applyPaper();
        } else if (item.name === 'FLASH') {
          style.flash = flagNumber(evalExpr(item.value));
        }
      } else if (item.type === 'expr') {
        printValue(evalExpr(item.value), style);
      }
      if (item.sep === ',') {
        cursor.x = Math.min(COLS - 1, (Math.floor(cursor.x / 8) + 1) * 8);
      }
    }
    const last = items[items.length - 1];
    if (!last || (last.sep !== ';' && last.sep !== ',')) newline();
  }

  function jumpTo(state, target) {
    if (!state.lines) fail('N Statement lost');
    const index = state.lines.findIndex((line) => line.number === target);
    if (index < 0) fail('N Statement lost');
    state.lineIndex = index;
    state.stmtIndex = 0;
  }

  function skipFor(state, name) {
    let lineIndex = state.lineIndex;
    let stmtIndex = state.stmtIndex + 1;
    let depth = 0;
    while (lineIndex < state.lines.length) {
      const statements = state.lines[lineIndex].stmts;
      for (; stmtIndex < statements.length; stmtIndex += 1) {
        const statement = statements[stmtIndex];
        if (statement.type === 'for') depth += 1;
        else if (statement.type === 'next') {
          if (depth === 0) {
            if (!statement.name || statement.name === name) {
              state.lineIndex = lineIndex;
              state.stmtIndex = stmtIndex + 1;
              return;
            }
          } else depth -= 1;
        }
      }
      lineIndex += 1;
      stmtIndex = 0;
    }
    fail('I For without NEXT');
  }

  function execInput(statement, state) {
    const prompt = statement.prompt ? String(evalExpr(statement.prompt)) : '';
    if (prompt) printText(prompt, attrs, { newline: false });
    else printText('? ', attrs, { newline: false });
    awaiting = {
      name: statement.name,
      state: state.lines ? state : null,
    };
    if (state.lines) state.stmtIndex += 1;
    renderPrompt();
    input.focus();
    return 'paused';
  }

  function execStatement(statement, state) {
    switch (statement.type) {
      case 'nothing':
        return null;
      case 'print':
        execPrint(statement);
        return null;
      case 'let': {
        const value = evalExpr(statement.value);
        if (statement.name.endsWith('$')) {
          vars.set(statement.name, typeof value === 'string' ? value : formatNumber(toNumber(value)));
        } else {
          vars.set(statement.name, toNumber(value));
        }
        return null;
      }
      case 'if': {
        const block = isTruthy(evalExpr(statement.cond)) ? statement.thenBlock : statement.elseBlock;
        return execBlock(block, state);
      }
      case 'for': {
        if (!state.lines) fail('C Nonsense in BASIC');
        const start = toNumber(evalExpr(statement.start));
        const end = toNumber(evalExpr(statement.end));
        const step = toNumber(evalExpr(statement.step));
        if (step === 0) fail('Q Parameter error');
        vars.set(statement.name, start);
        const empty = step > 0 ? start > end : start < end;
        if (empty) {
          skipFor(state, statement.name);
          return 'jumped';
        }
        state.forStack.push({
          name: statement.name,
          end,
          step,
          lineIndex: state.lineIndex,
          stmtIndex: state.stmtIndex + 1,
        });
        return null;
      }
      case 'next': {
        const frame = state.forStack[state.forStack.length - 1];
        if (!frame || (statement.name && statement.name !== frame.name)) fail('1 NEXT without FOR');
        const nextValue = toNumber(vars.get(frame.name) || 0) + frame.step;
        vars.set(frame.name, nextValue);
        const repeat = frame.step > 0 ? nextValue <= frame.end : nextValue >= frame.end;
        if (repeat) {
          state.lineIndex = frame.lineIndex;
          state.stmtIndex = frame.stmtIndex;
          return 'jumped';
        }
        state.forStack.pop();
        return null;
      }
      case 'goto': {
        const target = toInteger(evalExpr(statement.target));
        if (!state.lines) {
          if (program.has(target)) {
            runProgram(false, target);
            return null;
          }
          if (lastList.length && target >= 1 && target <= lastList.length) {
            showOpen(String(target));
            return null;
          }
          fail('N Statement lost');
        }
        jumpTo(state, target);
        return 'jumped';
      }
      case 'nav':
        showNav(statement.target);
        if (String(statement.target).trim().toUpperCase() === 'SHELL') {
          return state.lines ? 'stopped' : null;
        }
        return null;
      case 'open':
        showOpen(statement.target);
        return null;
      case 'cat':
        if (!statement.target) {
          zxError(T.usageCat);
          return null;
        }
        showProject(statement.target);
        return null;
      case 'ls':
        showLs();
        return null;
      case 'tree':
        showTree();
        return null;
      case 'gosub': {
        if (!state.lines) fail('C Nonsense in BASIC');
        state.gosubStack.push({ lineIndex: state.lineIndex, stmtIndex: state.stmtIndex + 1 });
        jumpTo(state, toInteger(evalExpr(statement.target)));
        return 'jumped';
      }
      case 'return': {
        const returnTo = state.gosubStack.pop();
        if (!returnTo) fail('7 RETURN without GOSUB');
        state.lineIndex = returnTo.lineIndex;
        state.stmtIndex = returnTo.stmtIndex;
        return 'jumped';
      }
      case 'input':
        return execInput(statement, state);
      case 'cls':
        clearScreen();
        return null;
      case 'new':
        program.clear();
        vars.clear();
        lastList = [];
        state.forStack = [];
        state.gosubStack = [];
        clearScreen();
        printLine('0 OK', attrs);
        return state.lines ? 'stopped' : null;
      case 'clear':
        vars.clear();
        return null;
      case 'list': {
        const lines = Array.from(program.values()).sort((a, b) => a.number - b.number);
        lines.forEach((line) => printLine(`${line.number} ${line.source}`, attrs));
        return null;
      }
      case 'run':
        if (state.lines) fail('C Nonsense in BASIC');
        runProgram(false);
        return null;
      case 'stop':
        printLine('9 STOP', { ink: 2, bright: 1 });
        return 'stopped';
      case 'shell':
        setMode('shell');
        return state.lines ? 'stopped' : null;
      case 'help':
        showHelp();
        return null;
      case 'load':
        loadDemo();
        return null;
      case 'save':
        printLine('Saving...', attrs);
        return null;
      case 'color': {
        const value = evalExpr(statement.value);
        if (statement.name === 'bright' || statement.name === 'flash') attrs[statement.name] = flagNumber(value);
        else attrs[statement.name] = colorNumber(value);
        applyPaper();
        applyBorder();
        return null;
      }
      case 'plot': {
        const x = toInteger(evalExpr(statement.x));
        const y = toInteger(evalExpr(statement.y));
        if (x < 0 || x > 255 || y < 0 || y > 191) fail('B Integer out of range');
        paint(x, y, attrs.ink, attrs.bright);
        lastPlot = { x, y };
        return null;
      }
      case 'draw': {
        const dx = toInteger(evalExpr(statement.x));
        const dy = toInteger(evalExpr(statement.y));
        const x = lastPlot.x + dx;
        const y = lastPlot.y + dy;
        line(lastPlot.x, lastPlot.y, x, y, attrs.ink, attrs.bright);
        lastPlot = { x, y };
        return null;
      }
      case 'circle': {
        const radius = toInteger(evalExpr(statement.radius));
        if (radius < 0) fail('B Integer out of range');
        circle(lastPlot.x, lastPlot.y, radius, attrs.ink, attrs.bright);
        return null;
      }
      default:
        fail('C Nonsense in BASIC');
        return null;
    }
  }

  function execBlock(statements, state) {
    for (const statement of statements) {
      const result = execStatement(statement, state);
      if (result) return result;
    }
    return null;
  }

  function runProgram(resume, startLine) {
    if (!program.size) {
      printLine('0 OK', attrs);
      return;
    }
    let state = resume ? runState : null;
    if (!state) {
      vars.clear();
      state = {
        lines: Array.from(program.values()).sort((a, b) => a.number - b.number),
        lineIndex: 0,
        stmtIndex: 0,
        forStack: [],
        gosubStack: [],
      };
      if (startLine !== undefined) {
        const index = state.lines.findIndex((line) => line.number === startLine);
        if (index < 0) fail('N Statement lost');
        state.lineIndex = index;
      }
    }
    runState = state;
    let guard = 0;
    try {
      while (state.lineIndex < state.lines.length) {
        guard += 1;
        if (guard > 200000) {
          runState = null;
          fail('L BREAK into program');
        }
        const line = state.lines[state.lineIndex];
        if (state.stmtIndex >= line.stmts.length) {
          state.lineIndex += 1;
          state.stmtIndex = 0;
          continue;
        }
        const statement = line.stmts[state.stmtIndex];
        const result = execStatement(statement, state);
        if (result === 'paused') {
          runState = state;
          return;
        }
        if (result === 'stopped') {
          runState = null;
          return;
        }
        if (result === 'jumped') continue;
        state.stmtIndex += 1;
      }
      runState = null;
      printLine('0 OK', attrs);
    } catch (error) {
      runState = null;
      awaiting = null;
      zxError(formatError(error));
    }
  }

  function completeInput(raw) {
    const pending = awaiting;
    awaiting = null;
    if (!pending) return;
    if (pending.name.endsWith('$')) {
      vars.set(pending.name, raw);
    } else {
      const value = Number(raw);
      if (raw.trim() === '' || !Number.isFinite(value)) {
        zxError('C Nonsense in BASIC');
        return;
      }
      vars.set(pending.name, value);
    }
    printLine(raw, attrs);
    if (pending.state) runProgram(true);
    else printLine('0 OK', attrs);
  }

  function executeLine(source) {
    const text = String(source || '').trim();
    if (!text) return;
    const numbered = text.match(/^(\d+)\s*(.*)$/);
    if (numbered) {
      const number = Number(numbered[1]);
      const body = numbered[2].trim();
      if (number < 1 || number > 9999) {
        zxError('G No room for line');
        return;
      }
      if (!body) {
        program.delete(number);
        return;
      }
      try {
        const stmts = compileStatements(body);
        program.set(number, { number, source: body, stmts });
      } catch (error) {
        zxError(formatError(error));
      }
      return;
    }
    try {
      const statements = compileStatements(text);
      const state = { lines: null, lineIndex: 0, stmtIndex: 0, forStack: [], gosubStack: [] };
      const result = execBlock(statements, state);
      if (result === 'jumped') fail('N Statement lost');
      if (awaiting) return;
    } catch (error) {
      awaiting = null;
      zxError(formatError(error));
    }
  }

  function zxError(message) {
    if (cursor.x !== 0) newline();
    printLine(String(message), { ink: 2, bright: 1 });
    renderPrompt();
    input.focus();
  }

  function showHelp() {
    attrs = { ink: WHITE, paper: BLACK, bright: 0, flash: 0, border: WHITE };
    applyPaper();
    applyBorder();
    clearScreen();
    const lines = [
      'ZX SPECTRUM 48K - BASIC',
      '',
      'PRINT "HELLO"',
      'LET A=10   A=A+1',
      'FOR I=1 TO 10: PRINT I: NEXT I',
      'IF A>10 THEN PRINT "BIG"',
      'GOTO 100   GOSUB 100   RETURN',
      'INPUT A$   LIST   RUN   NEW',
      'CLS   STOP   REM',
      'BORDER 2   PAPER 0   INK 6',
      'BRIGHT 1   FLASH 1',
      'PLOT 128,96   DRAW 20,20',
      'CIRCLE 30',
      '',
      'NAVIGATION',
      'SITES  APPS  TOOLS',
      'GOTO SITES / APPS / TOOLS',
      'GOTO <NAME>   OPEN <NAME>',
      'GOTO/OPEN 1..N  CAT <NAME>',
      'WHOAMI  ABOUT  CONTACT  GITHUB',
      'SHELL  back to console',
      'LOAD ""  demo program',
      'CV   LS   TREE',
    ];
    lines.forEach((text, index) => {
      printAt(0, index, text, { ink: index === 0 ? 6 : WHITE, bright: index === 0 ? 1 : 0 });
    });
  }

  function loadDemo() {
    const demo = [
      [10, 'BORDER 2: PAPER 0: INK 6: CLS'],
      [20, 'PRINT AT 4,4;"ZX SPECTRUM 48K"'],
      [30, 'PRINT AT 6,4;"HELLO FROM 1982"'],
      [40, 'FOR I=1 TO 6'],
      [50, 'PRINT AT 8+I,4;"*"'],
      [60, 'NEXT I'],
      [70, 'PLOT 128,96'],
      [80, 'DRAW 30,20'],
      [90, 'CIRCLE 20'],
    ];
    program.clear();
    lastList = [];
    try {
      demo.forEach(([number, source]) => {
        program.set(number, { number, source, stmts: compileStatements(source) });
      });
    } catch (error) {
      program.clear();
      zxError(formatError(error));
      return;
    }
    clearScreen();
    printLine('DEMO LOADED - TYPE RUN', { ink: 6, bright: 1 });
  }

  // ---------------------------------------------------------- mode

  function setMode(next) {
    const target = next === 'zx' ? 'zx' : 'shell';
    root.dataset.mode = target;
    shellPane.hidden = target === 'zx';
    pane.hidden = target !== 'zx';
    modeButtons.forEach((button) => {
      const active = button.dataset.mode === target;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (titleEl) titleEl.textContent = target === 'zx' ? 'ZX SPECTRUM 48K' : shellTitle;
    if (yearEl) yearEl.textContent = target === 'zx' ? '1982' : shellYear;
    root.setAttribute('aria-label', target === 'zx'
      ? (lang === 'cs' ? 'ZX Spectrum 48K – BASIC' : 'ZX Spectrum 48K – BASIC')
      : shellAria);
    if (target === 'zx') {
      bootZX();
      renderAll();
      renderInput();
      input.focus();
    } else if (shellInput) {
      shellInput.focus();
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  root.addEventListener('terminal:zx', () => setMode('zx'));

  pane.addEventListener('click', (event) => {
    if (event.target.closest('button, a')) return;
    input.focus();
  });

  const ZX_KEYWORDS = [
    'PRINT', 'LET', 'IF', 'THEN', 'ELSE', 'FOR', 'TO', 'STEP', 'NEXT', 'GOTO',
    'GOSUB', 'RETURN', 'INPUT', 'LIST', 'RUN', 'NEW', 'CLS', 'CLEAR', 'STOP',
    'BORDER', 'PAPER', 'INK', 'BRIGHT', 'FLASH', 'PLOT', 'DRAW', 'CIRCLE',
    'RANDOMIZE', 'REM', 'PAUSE', 'SHELL', 'HELP', 'LOAD', 'SAVE',
    'SITES', 'APPS', 'TOOLS', 'WHOAMI', 'ABOUT', 'CONTACT', 'GITHUB', 'CV',
    'OPEN', 'CAT', 'LS', 'TREE',
  ];

  pane.hidden = true;
  shellPane.hidden = false;
  applyPaper();
  applyBorder();
  renderScreen();
  renderPrompt();
})();
