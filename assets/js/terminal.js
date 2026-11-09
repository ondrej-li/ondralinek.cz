(() => {
  const root = document.querySelector('.terminal');
  if (!root) return;

  let data;
  try {
    data = JSON.parse(root.dataset.terminal || '{}');
  } catch {
    return;
  }

  const out = root.querySelector('.terminal-out');
  const input = root.querySelector('#terminal-input');
  const promptEl = root.querySelector('.t-prompt');
  if (!out || !input || !promptEl) return;

  const lang = data.lang === 'cs' ? 'cs' : 'en';
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const USER = 'ondra@ondralinek';

  const S = {
    en: {
      helpTitle: 'Available commands',
      helpHint: 'Tab completes commands; Up/Down walks the history.',
      help: [
        ['help', 'this list'],
        ['ls [dir]', 'list sites, apps and tools'],
        ['cd <dir>', 'sites | apps | tools | .. | ~'],
        ['pwd', 'print the current directory'],
        ['cat <name>', 'read a project, about.txt or contact.txt'],
        ['tree', 'print the whole index'],
        ['open <name>', 'open a project in a new tab'],
        ['sites · apps · tools', 'quick listings'],
        ['whoami · about', 'who is behind this'],
        ['github', 'open the GitHub profile'],
        ['contact', 'e-mail, GitHub, CV'],
        ['hangman', 'play hangman'],
        ['date · uname · neofetch · uptime', 'system information'],
        ['echo <text>', 'print text'],
        ['history', 'command history'],
        ['clear / Ctrl+L', 'clear the screen'],
        ['sudo <cmd>', 'try it'],
        ['exit', 'try it'],
      ],
      notFound: (cmd) => `command not found: ${cmd}. Type "help".`,
      lsDirs: 'sites/   apps/   tools/',
      lsFiles: 'about.txt   contact.txt   README.md',
      dirNotFound: (dir) => `cd: no such directory: ${dir}`,
      catUsage: 'usage: cat <site|app|tool|about.txt|contact.txt>',
      catNotFound: (name) => `cat: no such file or directory: ${name}`,
      openUsage: 'usage: open <site|app|tool>',
      openNotFound: (name) => `open: nothing named "${name}"`,
      opening: (url) => `Opening ${url}`,
      multiple: 'More than one match — be more specific:',
      whoami: 'Ondra Linek — engineer. I build Go backends and native apps for Apple platforms, and I stay responsible for the result from idea to production.',
      about: [
        'I am a software engineer from Czechia. The last decade has been Go backends — internal platforms, onboarding, billing, support tooling and automation — and Apple apps in my own time.',
        'I take systems from idea to production and stay responsible for them: architecture, implementation, operation and the decisions in between. In the age of LLMs and agents, writing code is the easy part — knowing what to build, keeping it correct and standing behind it is the job.',
      ],
      contactNote: 'Open to collaboration, new projects and ideas worth building.',
      readme: 'ondralinek.cz — a static Hugo site for the live sites, apps and open-source tools I run. Everything here is live.',
      historyTitle: 'history',
      historyEmpty: 'No commands yet.',
      sudo: 'ondra is not in the sudoers file. This incident has been reported.',
      exit: 'Nice try. This shell stays open.',
      rm: 'Permission denied. And please do not.',
      githubOpen: (url) => `Opening ${url}`,
      labels: {
        domain: 'domain',
        url: 'url',
        platforms: 'platforms',
        status: 'status',
        site: 'site',
        store: 'store',
        source: 'source',
        language: 'language',
        email: 'E-mail',
        github: 'GitHub',
        cv: 'CV',
      },
      status: { live: 'App Store', beta: 'TestFlight', oss: 'Open source', wip: 'In development' },
      nf: { os: 'OS', stack: 'Stack', shell: 'Shell', uptime: 'Uptime' },
      os: 'Debian 13 · aarch64',
      shell: 'ondalink-sh 1.0',
      stack: 'Go · SQL · Cloud · LLM',
      unameAll: 'Linux ondralinek.cz 6.12.115-2 #1 SMP PREEMPT_DYNAMIC Debian 6.12.115-2 aarch64 GNU/Linux',
      uptime: (up) => `up ${up}, 1 user, load average: 0.00, 0.00, 0.00`,
      hangman: {
        title: 'HANGMAN',
        intro: 'Guess the word one letter at a time. Six wrong guesses allowed.',
        help: 'Type a letter, or "quit" to leave.',
        prompt: 'hangman>',
        active: 'A game is already running. Guess a letter or type "quit".',
        invalid: 'Guess exactly one letter, or type "quit".',
        already: (letter) => `Already guessed: ${letter}`,
        good: (letter) => `Good: ${letter}`,
        wrong: (letter) => `Wrong: ${letter}`,
        left: (n) => `left: ${n}`,
        wrongList: 'wrong:',
        word: 'word:',
        win: (word) => `You win. The word was ${word}.`,
        lose: (word) => `You lose. The word was ${word}.`,
        quit: (word) => `Game abandoned. The word was ${word}.`,
        again: 'Type "hangman" to play again.',
      },
    },
    cs: {
      helpTitle: 'Dostupné příkazy',
      helpHint: 'Tab doplňuje příkazy; nahoru/dolů prochází historii.',
      help: [
        ['help', 'tento seznam'],
        ['ls [adresář]', 'vypíše weby, aplikace a nástroje'],
        ['cd <adresář>', 'sites | apps | tools | .. | ~'],
        ['pwd', 'vypíše aktuální adresář'],
        ['cat <název>', 'přečte projekt, about.txt nebo contact.txt'],
        ['tree', 'vypíše celý index'],
        ['open <název>', 'otevře projekt v nové kartě'],
        ['sites · apps · tools', 'rychlý výpis'],
        ['whoami · about', 'kdo za tím stojí'],
        ['github', 'otevře profil na GitHubu'],
        ['contact', 'e-mail, GitHub, CV'],
        ['hangman', 'zahraje hangmana'],
        ['date · uname · neofetch · uptime', 'systémové informace'],
        ['echo <text>', 'vypíše text'],
        ['history', 'historie příkazů'],
        ['clear / Ctrl+L', 'vyčistí obrazovku'],
        ['sudo <příkaz>', 'zkuste to'],
        ['exit', 'zkuste to'],
      ],
      notFound: (cmd) => `příkaz nenalezen: ${cmd}. Zkuste "help".`,
      lsDirs: 'sites/   apps/   tools/',
      lsFiles: 'about.txt   contact.txt   README.md',
      dirNotFound: (dir) => `cd: adresář neexistuje: ${dir}`,
      catUsage: 'použití: cat <web|aplikace|nástroj|about.txt|contact.txt>',
      catNotFound: (name) => `cat: soubor nebo adresář neexistuje: ${name}`,
      openUsage: 'použití: open <web|aplikace|nástroj>',
      openNotFound: (name) => `open: nic takového tu není: "${name}"`,
      opening: (url) => `Otevírám ${url}`,
      multiple: 'Více shod — upřesněte:',
      whoami: 'Ondra Linek — inženýr. Stavím Go backendy a nativní aplikace pro platformy Apple a zůstávám odpovědný za výsledek od nápadu po provoz.',
      about: [
        'Jsem softwarový inženýr z Česka. Posledních deset let stavím backendy v Go — interní platformy, onboarding, billing, podpůrné nástroje a automatizaci — a ve volném čase nativní aplikace pro platformy Apple.',
        'Systémy beru od nápadu do provozu a zůstávám za ně odpovědný: architektura, implementace, provoz a rozhodnutí mezi tím. V éře LLM a agentů je psaní kódu ta snadná část — vědět, co postavit, udržet to správné a stát si za tím, je ta práce.',
      ],
      contactNote: 'Otevřený spolupráci, novým projektům a nápadům, které stojí za to postavit.',
      readme: 'ondralinek.cz — statický web v Hugu pro weby, aplikace a open-source nástroje, které provozuju. Všechno, co tu je, běží.',
      historyTitle: 'historie',
      historyEmpty: 'Zatím žádné příkazy.',
      sudo: 'ondra není v sudoers. Incident byl nahlášen.',
      exit: 'Hezký pokus. Tenhle shell se nezavírá.',
      rm: 'Permission denied. A prosím, nedělejte to.',
      githubOpen: (url) => `Otevírám ${url}`,
      labels: {
        domain: 'doména',
        url: 'url',
        platforms: 'platformy',
        status: 'stav',
        site: 'web',
        store: 'App Store',
        source: 'zdroj',
        language: 'jazyk',
        email: 'E-mail',
        github: 'GitHub',
        cv: 'CV',
      },
      status: { live: 'App Store', beta: 'TestFlight', oss: 'Open source', wip: 'Ve vývoji' },
      nf: { os: 'OS', stack: 'Stack', shell: 'Shell', uptime: 'Uptime' },
      os: 'Debian 13 · aarch64',
      shell: 'ondalink-sh 1.0',
      stack: 'Go · SQL · Cloud · LLM',
      unameAll: 'Linux ondralinek.cz 6.12.115-2 #1 SMP PREEMPT_DYNAMIC Debian 6.12.115-2 aarch64 GNU/Linux',
      uptime: (up) => `up ${up}, 1 uživatel, load average: 0.00, 0.00, 0.00`,
      hangman: {
        title: 'HANGMAN',
        intro: 'Hádejte slovo po jednom písmenu. Šest chybných pokusů.',
        help: 'Napište písmeno nebo "quit" pro odchod.',
        prompt: 'hangman>',
        active: 'Hra už běží. Hádejte písmeno nebo napište "quit".',
        invalid: 'Zadejte právě jedno písmeno, nebo "quit".',
        already: (letter) => `Už bylo: ${letter}`,
        good: (letter) => `Dobře: ${letter}`,
        wrong: (letter) => `Špatně: ${letter}`,
        left: (n) => `zbývá: ${n}`,
        wrongList: 'chybná:',
        word: 'slovo:',
        win: (word) => `Vyhráli jste. Slovo bylo ${word}.`,
        lose: (word) => `Prohráli jste. Slovo bylo ${word}.`,
        quit: (word) => `Hra ukončena. Slovo bylo ${word}.`,
        again: 'Napište "hangman" pro další hru.',
      },
    },
  }[lang];

  const COMMANDS = [
    'help', 'ls', 'cd', 'pwd', 'cat', 'tree', 'open', 'sites', 'apps', 'tools',
    'whoami', 'about', 'github', 'contact', 'hangman', 'date', 'uname',
    'neofetch', 'uptime', 'echo', 'history', 'clear', 'sudo', 'exit', 'rm',
    'projects', 'me',
  ];
  const WORDS = ['GOLANG', 'SWIFTUI', 'SPECTRUM', 'HANGMAN', 'COMPILER', 'PIPELINE', 'DATABASE', 'TERMINAL', 'KEYBOARD', 'MAINFRAME'];

  let cwd = '~';
  let history = [];
  let histIndex = 0;
  let game = null;
  let currentPrompt = '';
  const started = Date.now();

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  let scrollFrame = 0;

  function scroll() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      out.scrollTop = out.scrollHeight;
    });
  }

  function line(text, cls) {
    const p = el('div', 't-line' + (cls ? ' ' + cls : ''), text);
    out.appendChild(p);
    scroll();
    return p;
  }

  function link(url, label) {
    const a = el('a', 't-link', label);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function makeRow(key, value) {
    const row = el('div', 't-row');
    row.append(el('span', 't-row-key', key), el('span', 't-row-val', value));
    return row;
  }

  function kv(key, value) {
    out.appendChild(makeRow(key, value));
    scroll();
  }

  function kvLink(key, label, url) {
    const row = el('div', 't-row');
    row.append(el('span', 't-row-key', key), link(url, label));
    out.appendChild(row);
    scroll();
  }

  function blank() {
    line('', 't-block');
  }

  function echo(raw) {
    const p = el('div', 't-line');
    p.append(el('span', 't-prompt-inline', currentPrompt + ' '), el('span', 't-echo', raw));
    out.appendChild(p);
    scroll();
  }

  function defaultPrompt() {
    return `${USER}:${cwd}$`;
  }

  function setPrompt(text) {
    currentPrompt = text;
    promptEl.textContent = text;
  }

  function upTime() {
    const seconds = Math.floor((Date.now() - started) / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
  }

  function resolveDir(arg) {
    if (arg === undefined || arg === '' || arg === '~' || arg === '/') return '~';
    if (arg === '.') return cwd;
    if (arg === '..') return '~';
    const clean = arg.replace(/\/+$/, '');
    if (clean === 'sites' || clean === 'apps' || clean === 'tools') return '~/' + clean;
    if (clean === '~/sites' || clean === '~/apps' || clean === '~/tools') return clean;
    return null;
  }

  function findItems(query) {
    const q = String(query || '').toLowerCase().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    if (!q) return [];
    const all = [];
    for (const site of data.sites || []) {
      all.push({ type: 'site', key: site.domain, item: site, values: [site.domain, site.name, site.url] });
    }
    for (const app of data.apps || []) {
      all.push({ type: 'app', key: app.id, item: app, values: [app.id, app.name, app.site, app.repo] });
    }
    for (const tool of data.tools || []) {
      all.push({ type: 'tool', key: tool.name, item: tool, values: [tool.name, tool.repo] });
    }
    const clean = (values) => values.filter(Boolean).map((v) => String(v).toLowerCase());
    const exact = all.filter((entry) => clean(entry.values).includes(q));
    if (exact.length) return exact;
    return all.filter((entry) => clean(entry.values).some((v) => v.includes(q)));
  }

  function urlFor(match) {
    const item = match.item;
    if (match.type === 'site') return item.url;
    if (match.type === 'app') {
      if (item.site) return item.site;
      if (item.store) return item.store;
      if (item.repo) return 'https://github.com/' + item.repo;
      return '';
    }
    if (match.type === 'tool' && item.repo) return 'https://github.com/' + item.repo;
    return '';
  }

  function printMatches(matches) {
    line(S.multiple, 't-warn');
    for (const match of matches) {
      line(`  ${match.key}  ·  ${match.type}`, 't-dim');
    }
    blank();
  }

  function printItem(match) {
    const item = match.item;
    if (match.type === 'site') {
      line(item.name, 't-accent t-block');
      kv(S.labels.domain, item.domain);
      line(item.desc, 't-block');
      kvLink(S.labels.url, item.url, item.url);
    } else if (match.type === 'app') {
      line(item.name, 't-accent t-block');
      kv(S.labels.platforms, item.platforms || '—');
      kv(S.labels.status, S.status[item.status] || item.status || '—');
      line(item.tagline, 't-block');
      line(item.summary, 't-dim t-block');
      if (item.site) kvLink(S.labels.site, item.site, item.site);
      if (item.store) kvLink(S.labels.store, item.store, item.store);
      if (item.repo) kvLink(S.labels.source, 'github.com/' + item.repo, 'https://github.com/' + item.repo);
    } else {
      line(item.name, 't-accent t-block');
      kv(S.labels.language, item.lang || '—');
      line(item.desc, 't-block');
      if (item.repo) kvLink(S.labels.source, 'github.com/' + item.repo, 'https://github.com/' + item.repo);
    }
    blank();
  }

  function printAbout() {
    S.about.forEach((paragraph) => line(paragraph, 't-block'));
    if (data.links && data.links.cv) kvLink(S.labels.cv, 'me.ondralinek.cz', data.links.cv);
    blank();
  }

  function printContact() {
    kvLink(S.labels.email, data.links.email, 'mailto:' + data.links.email);
    kvLink(S.labels.github, data.links.github.replace(/^https:\/\//, ''), data.links.github);
    kvLink(S.labels.cv, data.links.cv.replace(/^https:\/\//, ''), data.links.cv);
    line(S.contactNote, 't-dim');
    blank();
  }

  function printHelp() {
    line(S.helpTitle, 't-accent t-block');
    for (const [cmd, desc] of S.help) {
      const p = el('div', 't-line');
      p.append(el('span', 't-cmd', cmd), el('span', 't-dim', ' — ' + desc));
      out.appendChild(p);
    }
    line(S.helpHint, 't-dim t-block');
    scroll();
  }

  function listDirectory(dir) {
    if (dir === '~') {
      line(S.lsDirs, 't-accent');
      line(S.lsFiles, 't-dim');
    } else if (dir === '~/sites') {
      (data.sites || []).forEach((site) => kv(site.domain, site.name));
    } else if (dir === '~/apps') {
      (data.apps || []).forEach((app) => kv(app.name, app.platforms || ''));
    } else if (dir === '~/tools') {
      (data.tools || []).forEach((tool) => kv(tool.name, tool.lang || ''));
    }
  }

  function printTree() {
    const lines = ['~', '├── sites/'];
    (data.sites || []).forEach((site, index) => {
      lines.push(`│   ${index === data.sites.length - 1 ? '└──' : '├──'} ${site.domain}`);
    });
    lines.push('├── apps/');
    (data.apps || []).forEach((app, index) => {
      lines.push(`│   ${index === data.apps.length - 1 ? '└──' : '├──'} ${app.name}`);
    });
    lines.push('├── tools/');
    (data.tools || []).forEach((tool, index) => {
      lines.push(`│   ${index === data.tools.length - 1 ? '└──' : '├──'} ${tool.name}`);
    });
    lines.push('├── about.txt');
    lines.push('├── contact.txt');
    lines.push('└── README.md');
    const pre = el('pre', 't-pre', lines.join('\n'));
    out.appendChild(pre);
    blank();
    scroll();
  }

  function openMatch(match) {
    const url = urlFor(match);
    if (!url) {
      line(S.openNotFound(match.key), 't-err');
      return;
    }
    line(S.opening(url), 't-dim');
    window.open(url, '_blank', 'noopener,noreferrer');
    blank();
  }

  function gallows(stage) {
    return [
      '  +---+',
      '  |   |',
      stage > 0 ? '  |   O' : '  |',
      stage > 2 ? (stage > 3 ? '  |  /|\\' : '  |  /|') : (stage > 1 ? '  |   |' : '  |'),
      stage > 4 ? (stage > 5 ? '  |  / \\' : '  |  /') : '  |',
      '  |',
      '=====',
    ].join('\n');
  }

  function drawBoard() {
    const art = el('pre', 't-pre', gallows(game.wrong.size));
    out.appendChild(art);
    const word = Array.from(game.word).map((letter) => (game.guessed.has(letter) ? letter : '_')).join(' ');
    line(`${S.hangman.word} ${word}`, 't-block');
    const wrong = Array.from(game.wrong).sort().join(' ') || '—';
    line(`${S.hangman.wrongList} ${wrong}   ·   ${S.hangman.left(game.max - game.wrong.size)}`, 't-dim');
    blank();
    scroll();
  }

  function startHangman() {
    if (game) {
      line(S.hangman.active, 't-warn');
      return;
    }
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    game = { word, guessed: new Set(), wrong: new Set(), max: 6 };
    blank();
    line(S.hangman.title, 't-accent t-block');
    line(S.hangman.intro);
    line(S.hangman.help, 't-dim');
    drawBoard();
    setPrompt(S.hangman.prompt);
  }

  function handleGuess(raw) {
    const value = raw.trim();
    if (!value) {
      setPrompt(S.hangman.prompt);
      return;
    }
    echo(raw);
    const lower = value.toLowerCase();
    if (lower === 'quit' || lower === 'q') {
      const word = game.word;
      game = null;
      setPrompt(defaultPrompt());
      line(S.hangman.quit(word), 't-warn');
      line(S.hangman.again, 't-dim');
      scroll();
      return;
    }
    if (lower === 'help' || value === '?') {
      line(S.hangman.help, 't-dim');
      return;
    }
    const letter = value.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) {
      line(S.hangman.invalid, 't-err');
      return;
    }
    if (game.guessed.has(letter) || game.wrong.has(letter)) {
      line(S.hangman.already(letter), 't-warn');
      return;
    }
    if (game.word.includes(letter)) {
      game.guessed.add(letter);
      line(S.hangman.good(letter), 't-ok');
    } else {
      game.wrong.add(letter);
      line(S.hangman.wrong(letter), 't-err');
    }
    drawBoard();
    if (Array.from(game.word).every((char) => game.guessed.has(char))) {
      const word = game.word;
      game = null;
      setPrompt(defaultPrompt());
      line(S.hangman.win(word), 't-ok t-block');
      line(S.hangman.again, 't-dim');
      scroll();
      return;
    }
    if (game.wrong.size >= game.max) {
      const word = game.word;
      game = null;
      setPrompt(defaultPrompt());
      line(S.hangman.lose(word), 't-err t-block');
      line(S.hangman.again, 't-dim');
      scroll();
    }
  }

  function abortGame() {
    const word = game.word;
    game = null;
    setPrompt(defaultPrompt());
    line(S.hangman.quit(word), 't-warn');
    line(S.hangman.again, 't-dim');
    scroll();
  }

  function clearOut() {
    out.replaceChildren();
    scroll();
  }

  function run(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setPrompt(game ? S.hangman.prompt : defaultPrompt());
      return;
    }
    echo(raw);
    if (history[history.length - 1] !== trimmed) history.push(trimmed);
    histIndex = history.length;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const positional = args.filter((arg) => !arg.startsWith('-'));

    switch (cmd) {
      case 'help':
        printHelp();
        break;
      case 'ls':
      case 'dir':
      case 'projects': {
        const dir = positional[0] ? resolveDir(positional[0]) : cwd;
        if (dir === null) {
          line(S.dirNotFound(positional[0] || ''), 't-err');
        } else {
          listDirectory(dir);
        }
        break;
      }
      case 'cd': {
        const dir = resolveDir(positional[0]);
        if (dir === null) {
          line(S.dirNotFound(positional[0] || ''), 't-err');
        } else {
          cwd = dir;
        }
        break;
      }
      case 'pwd':
        line(cwd);
        break;
      case 'cat': {
        const query = args.join(' ').replace(/^["']|["']$/g, '');
        if (!query) {
          line(S.catUsage, 't-warn');
          break;
        }
        const lower = query.toLowerCase();
        if (lower === 'about' || lower === 'about.txt') {
          printAbout();
          break;
        }
        if (lower === 'contact' || lower === 'contact.txt') {
          printContact();
          break;
        }
        if (lower === 'readme' || lower === 'readme.md') {
          line(S.readme, 't-block');
          blank();
          break;
        }
        const matches = findItems(query);
        if (!matches.length) line(S.catNotFound(query), 't-err');
        else if (matches.length > 1) printMatches(matches);
        else printItem(matches[0]);
        break;
      }
      case 'tree':
        printTree();
        break;
      case 'open': {
        const query = args.join(' ').replace(/^["']|["']$/g, '');
        if (!query) {
          line(S.openUsage, 't-warn');
          break;
        }
        const matches = findItems(query);
        if (!matches.length) line(S.openNotFound(query), 't-err');
        else if (matches.length > 1) printMatches(matches);
        else openMatch(matches[0]);
        break;
      }
      case 'sites':
        (data.sites || []).forEach((site) => kv(site.domain, site.name));
        break;
      case 'apps':
        (data.apps || []).forEach((app) => kv(app.name, app.platforms || ''));
        break;
      case 'tools':
        (data.tools || []).forEach((tool) => kv(tool.name, tool.lang || ''));
        break;
      case 'whoami':
      case 'me':
        line(S.whoami, 't-block');
        blank();
        break;
      case 'about':
        printAbout();
        break;
      case 'github': {
        const url = data.links.github;
        line(S.githubOpen(url), 't-dim');
        window.open(url, '_blank', 'noopener,noreferrer');
        blank();
        break;
      }
      case 'contact':
        printContact();
        break;
      case 'hangman':
        startHangman();
        break;
      case 'date':
        line(new Date().toLocaleString(locale, { dateStyle: 'full', timeStyle: 'medium' }), 't-block');
        break;
      case 'uname':
        line(args.includes('-a') ? S.unameAll : 'Linux');
        break;
      case 'neofetch': {
        const wrap = el('div', 't-neofetch');
        const logo = el('pre', 't-pre', '  ┌───────┐\n  │  ›_   │\n  └───────┘');
        const dl = el('div');
        dl.appendChild(el('div', 't-line t-user', USER));
        dl.appendChild(makeRow(S.nf.os, S.os));
        dl.appendChild(makeRow(S.nf.stack, S.stack));
        dl.appendChild(makeRow(S.nf.shell, S.shell));
        dl.appendChild(makeRow(S.nf.uptime, upTime()));
        wrap.append(logo, dl);
        out.appendChild(wrap);
        blank();
        scroll();
        break;
      }
      case 'uptime':
        line(S.uptime(upTime()), 't-block');
        break;
      case 'echo':
        line(args.join(' '));
        break;
      case 'history':
        line(S.historyTitle, 't-accent t-block');
        if (!history.length) {
          line(S.historyEmpty, 't-dim');
        } else {
          history.forEach((item, index) => {
            const p = el('div', 't-line');
            p.append(el('span', 't-dim', String(index + 1).padStart(3, ' ') + '  '), el('span', '', item));
            out.appendChild(p);
          });
          scroll();
        }
        break;
      case 'clear':
        clearOut();
        break;
      case 'sudo':
        line(S.sudo, 't-err');
        break;
      case 'rm':
        line(S.rm, 't-err');
        break;
      case 'exit':
        line(S.exit, 't-warn');
        break;
      default:
        line(S.notFound(parts[0]), 't-err');
    }

    setPrompt(game ? S.hangman.prompt : defaultPrompt());
    scroll();
  }

  function complete() {
    const value = input.value;
    if (!value || value.includes(' ')) return;
    const matches = COMMANDS.filter((command) => command.startsWith(value));
    if (matches.length === 1) {
      input.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      line(matches.join('  '), 't-dim');
    }
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const raw = input.value;
      input.value = '';
      if (game) handleGuess(raw);
      else run(raw);
      histIndex = history.length;
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      histIndex = Math.max(0, histIndex - 1);
      input.value = history[histIndex] || '';
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!history.length) return;
      histIndex = Math.min(history.length, histIndex + 1);
      input.value = history[histIndex] || '';
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      complete();
      return;
    }
    if (event.key.toLowerCase() === 'l' && event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      clearOut();
      setPrompt(game ? S.hangman.prompt : defaultPrompt());
      return;
    }
    if (event.key.toLowerCase() === 'c' && event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      input.value = '';
      if (game) abortGame();
      else line('^C', 't-dim');
      setPrompt(game ? S.hangman.prompt : defaultPrompt());
    }
  });

  root.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    input.focus();
  });

  input.addEventListener('focus', scroll);

  setPrompt(defaultPrompt());
})();
