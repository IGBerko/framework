/*!
 * Framework v1.0.0
 * Реактивный мини-фреймворк с плагинами, каталогом библиотек и отладчиком Yozilla.
 */
(function (global) {
  'use strict';
  if (global.Framework) return;

  const VERSION = '1.0.0';
  const CFG = Object.assign({
    cloud: 'https://cdn.jsdelivr.net/gh/IGBerko/framework@main/%40framework1.0/plugins/',
    manifest: 'https://cdn.jsdelivr.net/gh/IGBerko/framework@main/framework.json',
    checkUpdates: true,
    welcome: true
  }, global.FrameworkConfig || {});
  const SERIES = VERSION.split('.').slice(0, 2).join('.'); // "1.0"

  /* ---------- утилиты ---------- */
  const cmp = (a, b) => {
    const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; }
    return 0;
  };
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const k in props || {}) {
      if (k === 'class') e.className = props[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
      else e.setAttribute(k, props[k]);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return e;
  }
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  const bus = {};
  const on = (ev, fn) => ((bus[ev] = bus[ev] || []).push(fn), () => { bus[ev] = bus[ev].filter(f => f !== fn); });
  const emit = (ev, data) => (bus[ev] || []).slice().forEach(f => { try { f(data); } catch (e) { Yozilla.error(e); } });

  /* =====================================================================
   *  YOZILLA — отладчик (консоль + окно на сайте)
   * ===================================================================== */
  const Yozilla = (function () {
    const logs = [], errors = [];
    let root, errBox, toastBox, panel, badge, badgeCount;

    const CSS = `
      *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
      .err{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(720px,calc(100vw - 32px));max-height:70vh;overflow:auto;
        background:#7f1d1d;color:#fff;border:2px solid #ef4444;border-radius:12px;box-shadow:0 20px 60px rgba(239,68,68,.45);z-index:2147483647}
      .hd{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#b91c1c;position:sticky;top:0}
      .hd b{flex:1;font-size:15px}
      .x{background:rgba(255,255,255,.18);border:0;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer}
      .x:hover{background:rgba(255,255,255,.3)}
      .it{padding:12px 14px;border-top:1px solid rgba(255,255,255,.15)}
      .it .m{font-weight:700;font-size:14px;word-break:break-word}
      .it .s{margin:6px 0 0;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;opacity:.85;word-break:break-word}
      .toast{position:fixed;right:16px;bottom:16px;width:min(380px,calc(100vw - 32px));background:#0f172a;color:#e2e8f0;border:1px solid #38bdf8;
        border-radius:12px;padding:14px;z-index:2147483646;box-shadow:0 12px 40px rgba(0,0,0,.4)}
      .toast h4{margin:0 0 6px;font-size:14px;color:#38bdf8}
      .toast p{margin:4px 0;font-size:13px}
      .toast a{color:#7dd3fc}
      .toast ul{margin:6px 0 0;padding-left:18px;font-size:12px}
      .toast .x{float:right;background:#1e293b}
      .badge{position:fixed;left:12px;bottom:12px;z-index:2147483645;background:#16a34a;color:#fff;border:0;border-radius:20px;padding:6px 12px;
        font-size:12px;font-weight:700;cursor:pointer;opacity:.75}
      .badge:hover{opacity:1}.badge.bad{background:#dc2626}
      .panel{position:fixed;left:12px;bottom:48px;width:min(460px,calc(100vw - 24px));max-height:50vh;overflow:auto;background:#0f172a;color:#e2e8f0;
        border:1px solid #334155;border-radius:10px;z-index:2147483645;font:12px/1.6 ui-monospace,Menlo,Consolas,monospace;padding:8px 10px}
      .panel div{padding:2px 0;border-bottom:1px solid #1e293b}
      .l-success{color:#4ade80}.l-error{color:#f87171}.l-warn{color:#fbbf24}.l-info{color:#7dd3fc}`;

    function ui() {
      if (root) return root;
      const host = h('div', { 'data-framework-ui': '' });
      root = host.attachShadow({ mode: 'open' });
      root.append(h('style', null, CSS));
      errBox = h('div'); toastBox = h('div'); panel = h('div', { class: 'panel', hidden: '' });
      badgeCount = h('span', null, '0');
      badge = h('button', { class: 'badge', title: 'Журнал Yozilla', onclick: () => { panel.hidden = !panel.hidden; renderPanel(); } }, '🦖 Yozilla ', badgeCount);
      root.append(errBox, toastBox, panel, badge);
      document.body.appendChild(host);
      return root;
    }
    const withUI = fn => document.body ? fn(ui()) : ready(() => fn(ui()));

    function renderPanel() {
      if (!panel || panel.hidden) return;
      panel.replaceChildren(...logs.slice(-80).map(l => h('div', { class: 'l-' + l.level }, `[${l.time}] ${l.msg}`)));
      panel.scrollTop = panel.scrollHeight;
    }
    function renderErrors() {
      errBox.replaceChildren();
      if (!errors.length) return;
      errBox.append(h('div', { class: 'err' },
        h('div', { class: 'hd' }, h('b', null, `🦖 Yozilla — ошибок: ${errors.length}`),
          h('button', { class: 'x', onclick: () => { errors.length = 0; renderErrors(); updateBadge(); } }, 'Закрыть')),
        errors.slice(-10).map(e => h('div', { class: 'it' }, h('div', { class: 'm' }, e.message), e.stack ? h('pre', { class: 's' }, e.stack) : null))));
    }
    function updateBadge() {
      if (!badge) return;
      badgeCount.textContent = String(logs.length);
      badge.classList.toggle('bad', errors.length > 0);
    }

    function out(level, msg, color, extra) {
      logs.push({ level, msg, time: new Date().toLocaleTimeString() });
      const fn = (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log);
      fn.call(console, '%cYozilla%c ' + msg, `background:${color};color:#fff;padding:1px 6px;border-radius:3px;font-weight:700`, 'color:inherit', ...(extra || []));
      withUI(() => { updateBadge(); renderPanel(); });
    }

    const api = {
      log: m => out('info', m, '#64748b'),
      info: m => out('info', m, '#0ea5e9'),
      warn: m => out('warn', m, '#d97706'),
      success: m => out('success', m, '#16a34a'),
      error(err, meta) {
        const message = err && err.message ? err.message : String(err);
        const stack = (meta && meta.stack) || (err && err.stack) || '';
        out('error', message, '#dc2626');
        errors.push({ message, stack: stack.split('\n').slice(0, 8).join('\n') });
        withUI(() => { renderErrors(); updateBadge(); });
      },
      notice(title, lines, link) {
        withUI(() => {
          const box = h('div', { class: 'toast' },
            h('button', { class: 'x', onclick: () => box.remove() }, '×'),
            h('h4', null, title),
            ...(lines.text || []).map(t => h('p', null, t)),
            link ? h('p', null, h('a', { href: link, target: '_blank', rel: 'noopener' }, link)) : null,
            lines.list && lines.list.length ? h('ul', null, lines.list.map(i => h('li', null, i))) : null);
          toastBox.append(box);
        });
      },
      async checkUpdates() {
        if (!CFG.checkUpdates) return;
        try {
          const res = await fetch(CFG.manifest, { cache: 'no-cache' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const m = await res.json();
          if (!m.latest || cmp(m.latest, VERSION) <= 0) { api.log(`Framework ${VERSION} — это последняя версия`); return; }
          const url = m.url || 'https://github.com/itrypro/framework/releases';
          const list = [];
          Object.keys(m.changelog || {}).filter(v => cmp(v, VERSION) > 0).sort(cmp).reverse().forEach(v => {
            const c = m.changelog[v] || {};
            [['added', 'Добавлено'], ['changed', 'Изменено'], ['fixed', 'Исправлено']].forEach(([k, label]) =>
              (c[k] || []).forEach(t => list.push(`${v} · ${label}: ${t}`)));
          });
          api.info(`Доступно обновление Framework: ${VERSION} → ${m.latest}. Скачать: ${url}`);
          list.forEach(l => api.log('  ' + l));
          api.notice(`Вышло обновление Framework ${m.latest}`, { text: [`У вас установлена версия ${VERSION}.`], list }, url);
        } catch (e) {
          api.warn('Не удалось проверить обновления: ' + e.message);
        }
      }
    };

    global.addEventListener('error', e => { if (e.error || e.message) api.error(e.error || e.message); });
    global.addEventListener('unhandledrejection', e => api.error(e.reason || 'Необработанный Promise reject'));
    return api;
  })();

  /* =====================================================================
   *  РЕАКТИВНОСТЬ
   * ===================================================================== */
  let active = null;
  const targets = new WeakMap(), proxies = new WeakMap();
  function track(t, k) {
    if (!active) return;
    let m = targets.get(t); if (!m) targets.set(t, m = new Map());
    let s = m.get(k); if (!s) m.set(k, s = new Set());
    s.add(active);
  }
  function trigger(t, k) {
    const m = targets.get(t), s = m && m.get(k);
    if (s) Array.from(s).forEach(f => f());
  }
  function reactive(o) {
    if (typeof o !== 'object' || o === null) return o;
    if (proxies.has(o)) return proxies.get(o);
    const p = new Proxy(o, {
      get(t, k, r) { track(t, k); return reactive(Reflect.get(t, k, r)); },
      set(t, k, v, r) { const old = t[k]; const ok = Reflect.set(t, k, v, r); if (old !== v) trigger(t, k); return ok; },
      deleteProperty(t, k) { const ok = Reflect.deleteProperty(t, k); trigger(t, k); return ok; }
    });
    proxies.set(o, p);
    return p;
  }
  function effect(fn) {
    const run = () => {
      const prev = active; active = run;
      try { fn(); } catch (e) { Yozilla.error(e); } finally { active = prev; }
    };
    run();
    return run;
  }

  /* ---------- шаблоны и директивы ---------- */
  function evaluate(scope, expr) {
    try { return new Function('scope', 'with(scope){return (' + expr + ')}')(scope); }
    catch (e) { Yozilla.error(`Ошибка в выражении «${expr}»: ${e.message}`, e); return ''; }
  }
  function run(scope, code, $event) {
    try { new Function('scope', '$event', 'with(scope){' + code + '}')(scope, $event); }
    catch (e) { Yozilla.error(`Ошибка в обработчике «${code}»: ${e.message}`, e); }
  }
  function assign(scope, expr, v) {
    try { new Function('scope', '__v', 'with(scope){' + expr + '=__v}')(scope, v); }
    catch (e) { Yozilla.error(`Не удалось записать в «${expr}»: ${e.message}`, e); }
  }
  function mount(root, scope) {
    (function walk(n) {
      if (n.nodeType === 3) {
        const tpl = n.textContent;
        if (tpl.includes('{{')) effect(() => {
          n.textContent = tpl.replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => { const v = evaluate(scope, e); return v == null ? '' : v; });
        });
        return;
      }
      if (n.nodeType !== 1 || n.hasAttribute('f-ignore')) return;
      for (const a of Array.from(n.attributes)) {
        const name = a.name, expr = a.value;
        if (name === 'f-text') effect(() => { n.textContent = evaluate(scope, expr); });
        else if (name === 'f-html') effect(() => { n.innerHTML = evaluate(scope, expr); });
        else if (name === 'f-show') effect(() => { n.style.display = evaluate(scope, expr) ? '' : 'none'; });
        else if (name === 'f-model') {
          const box = n.type === 'checkbox';
          effect(() => { const v = evaluate(scope, expr); if (box) n.checked = !!v; else if (n.value !== String(v == null ? '' : v)) n.value = v == null ? '' : v; });
          n.addEventListener(box ? 'change' : 'input', () => assign(scope, expr, box ? n.checked : n.value));
        } else if (name.startsWith('f-on:') || name.startsWith('@')) {
          n.addEventListener(name.replace(/^(f-on:|@)/, ''), ev => run(scope, expr, ev));
        } else if (name.startsWith('f-bind:')) {
          const at = name.slice(7);
          effect(() => { const v = evaluate(scope, expr); (v === false || v == null) ? n.removeAttribute(at) : n.setAttribute(at, v === true ? '' : v); });
        }
      }
      Array.from(n.childNodes).forEach(walk);
    })(root);
  }
  function app(sel, opts) {
    opts = opts || {};
    const scope = reactive(Object.assign({}, opts.state, opts.methods));
    ready(() => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) return Yozilla.error(`Framework.app: элемент «${sel}» не найден`);
      mount(el, scope);
      if (opts.mounted) opts.mounted.call(scope);
    });
    return scope;
  }

  /* =====================================================================
   *  МОДУЛИ: плагины (.framejs) и сторонние библиотеки
   * ===================================================================== */
  // Каталог библиотек: <frameplugins src="framecloud/lib/lodash">
  const LIBS = {
    lodash:   { url: 'https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js', global: '_' },
    dayjs:    { url: 'https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js', global: 'dayjs' },
    axios:    { url: 'https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js', global: 'axios' },
    chartjs:  { url: 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js', global: 'Chart' },
    marked:   { url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', global: 'marked' },
    anime:    { url: 'https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js', global: 'anime' },
    confetti: { url: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1/dist/confetti.browser.min.js', global: 'confetti' }
  };
  const pending = {}, loaded = {};

  // framecloud/1.0/math  →  <cloud>@framework1.0/plugins/math.framejs
  function resolve(src) {
    src = String(src).trim().replace(/^["']+|["'>]+$/g, '');
    const m = src.match(/^framecloud\/([^/]+)\/(.+)$/);
    if (m) {
      if (m[1] === 'lib') return { kind: 'lib', name: m[2] };
      return { kind: 'plugin', name: m[2], url: `${CFG.cloud}@framework${m[1]}/plugins/${m[2]}.framejs` };
    }
    const name = src.split('/').pop().replace(/\.(framejs|js)$/, '');
    return { kind: /\.framejs($|\?)/.test(src) ? 'plugin' : 'script', name, url: src };
  }
  const loadScript = url => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = () => ok();
    s.onerror = () => fail(new Error('не удалось загрузить файл ' + url));
    (document.head || document.documentElement).appendChild(s);
  });

  async function use(src) {
    const r = resolve(src), name = r.name;
    if (loaded[name]) return true;
    try {
      if (r.kind === 'lib') {
        const lib = LIBS[name];
        if (!lib) throw new Error(`библиотеки «${name}» нет в каталоге framecloud/lib (доступно: ${Object.keys(LIBS).join(', ')})`);
        if (!global[lib.global]) await loadScript(lib.url);
        if (!global[lib.global]) throw new Error(`файл загрузился, но глобальный объект ${lib.global} не появился`);
        Framework.libs[name] = global[lib.global];
      } else if (r.kind === 'script') {
        await loadScript(r.url);
      } else {
        await loadScript(r.url);
        const def = pending[name];
        if (!def) throw new Error(`файл загружен, но не вызвал Framework.plugin("${name}", …)`);
        if (def.requires) for (const dep of def.requires) if (!(await use(dep))) throw new Error('не подключилась зависимость ' + dep);
        if (def.install) await def.install(Framework, def);
        Framework.plugins[name] = def;
      }
      loaded[name] = true;
      Yozilla.success('Успешно подключен модуль ' + name);
      emit('module:ready', name);
      return true;
    } catch (e) {
      Yozilla.error(`Модуль ${name} не смог подключиться из-за ошибки: ${e && e.message ? e.message : e}`, e);
      emit('module:fail', name);
      return false;
    }
  }
  // Регистрация плагина: Framework.plugin('имя', { version, requires, install(fw) {} })
  function plugin(name, def) {
    pending[name] = typeof def === 'function' ? { install: def } : def;
    pending[name].name = name;
  }

  /* =====================================================================
   *  ПРИВЕТСТВЕННОЕ ОКНО (если на странице нет разметки)
   * ===================================================================== */
  function hasMarkup() {
    return Array.from(document.body ? document.body.childNodes : []).some(n =>
      n.nodeType === 3 ? n.textContent.trim() !== '' :
      n.nodeType === 1 && !n.hasAttribute('data-framework-ui') && !/^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE|FRAMEPLUGINS)$/.test(n.tagName));
  }
  function welcome() {
    const host = h('div', { 'data-framework-ui': '' });
    const sr = host.attachShadow({ mode: 'open' });
    const code = t => h('pre', { class: 'c' }, t);
    sr.append(h('style', null, `
      *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
      .w{position:fixed;inset:0;overflow:auto;background:linear-gradient(160deg,#0f172a,#1e1b4b);color:#e2e8f0;z-index:2147483640;padding:32px 16px}
      .in{max-width:820px;margin:0 auto}
      h1{text-align:center;font-size:clamp(26px,5vw,44px);margin:0 0 6px;background:linear-gradient(90deg,#38bdf8,#a78bfa,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}
      .v{text-align:center;opacity:.6;margin:0 0 28px}
      .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px 20px;margin:14px 0}
      h2{margin:0 0 8px;font-size:17px;color:#7dd3fc}
      p,li{line-height:1.65;font-size:14px}
      .c{background:#020617;border-radius:8px;padding:12px;font:12.5px/1.55 ui-monospace,Menlo,Consolas,monospace;overflow:auto;color:#a5f3fc;margin:8px 0 0}
      code{background:#020617;padding:1px 6px;border-radius:4px;color:#a5f3fc}
      button{display:block;margin:22px auto 0;background:#6366f1;border:0;color:#fff;padding:10px 22px;border-radius:8px;cursor:pointer;font-size:14px}`));
    sr.append(h('div', { class: 'w' }, h('div', { class: 'in' },
      h('h1', null, 'Спасибо что используете Framework!'),
      h('p', { class: 'v' }, `версия ${VERSION} · отладчик Yozilla включён`),
      h('div', { class: 'card' }, h('h2', null, 'Что это такое'),
        h('p', null, 'Framework — лёгкий слой поверх JavaScript: реактивные данные, шаблоны прямо в HTML, плагины и каталог сторонних библиотек. Без сборки и npm — достаточно одного <script>.')),
      h('div', { class: 'card' }, h('h2', null, '1. Подключение'),
        code('<script src="https://raw.githubusercontent.com/IGBerko/framework/refs/heads/main/%40framework1.0/frm.js"></script>\n<frameplugins src="framecloud/1.0/math"></frameplugins>')),
      h('div', { class: 'card' }, h('h2', null, '2. Реактивное приложение'),
        code('<div id="app">\n  <input f-model="name" placeholder="Имя">\n  <h2>Привет, {{ name || "незнакомец" }}!</h2>\n  <button @click="count++">Кликов: {{ count }}</button>\n</div>\n<script>\n  Framework.app("#app", { state: { name: "", count: 0 } });\n</script>'),
        h('p', null, 'Директивы: ', h('code', null, 'f-text'), ' ', h('code', null, 'f-html'), ' ', h('code', null, 'f-show'), ' ', h('code', null, 'f-model'), ' ', h('code', null, '@click'), ' ', h('code', null, 'f-bind:attr'), '.')),
      h('div', { class: 'card' }, h('h2', null, '3. Плагины и библиотеки'),
        h('p', null, 'Короткий адрес ', h('code', null, 'framecloud/1.0/math'), ' раскрывается в полный путь плагина. Сторонние библиотеки — через ', h('code', null, 'framecloud/lib/<имя>'), ': ' + Object.keys(LIBS).join(', ') + '.'),
        h('p', null, 'Несколько модулей: ', h('code', null, '<frameplugins src="framecloud/1.0/math, framecloud/lib/lodash">'))),
      h('div', { class: 'card' }, h('h2', null, '4. Yozilla'),
        h('p', null, 'Пишет в консоль о каждом модуле, показывает красное окно при ошибках и сообщает о новых версиях Framework со ссылкой и списком изменений. Журнал — кнопка «🦖 Yozilla» слева внизу.')),
      h('button', { onclick: () => host.remove() }, 'Закрыть это окно'))));
    document.body.appendChild(host);
  }

  /* =====================================================================
   *  ЗАПУСК
   * ===================================================================== */
  async function boot() {
    for (const tag of Array.from(document.querySelectorAll('frameplugins'))) {
      const raw = tag.getAttribute('src') || tag.textContent;
      for (const s of raw.split(/[,\n]/).map(x => x.trim()).filter(Boolean)) await use(s);
    }
    emit('ready');
    Yozilla.info(`Framework ${VERSION} запущен`);
    if (CFG.welcome && !hasMarkup()) welcome();
    Yozilla.checkUpdates();
  }

  const Framework = {
    version: VERSION, config: CFG, plugins: {}, libs: {}, catalog: LIBS,
    use, plugin, reactive, effect, mount, app, ready, on, emit, h, Yozilla,
    $: (s, r) => (r || document).querySelector(s),
    $$: (s, r) => Array.from((r || document).querySelectorAll(s))
  };
  global.Framework = Framework;
  global.Yozilla = Yozilla;

  if (!document.getElementById('framework-css')) {
    const st = document.createElement('style'); st.id = 'framework-css'; st.textContent = 'frameplugins{display:none}';
    (document.head || document.documentElement).appendChild(st);
  }
  ready(boot);
})(window);
