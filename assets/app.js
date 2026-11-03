/* SoundRoom concept prototype.
   Everything is simulated: no network calls, no real accounts.
   No innerHTML anywhere: every node is built with h(), so text typed by a
   person (room names, chat) can never turn into markup. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addKids(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      el.append(k.nodeType ? k : document.createTextNode(String(k)));
    }
  }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'vars') for (const [n, val] of Object.entries(v)) el.style.setProperty(n, String(val));
        else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      }
    }
    addKids(el, kids);
    return el;
  }
  function icon(name) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'i');
    s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS(SVGNS, 'use');
    u.setAttribute('href', '#i-' + name);
    s.append(u);
    return s;
  }
  const clear = (el) => { el.replaceChildren(); return el; };
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const mmss = (sec) => { const s = Math.max(0, Math.floor(sec)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const parseDur = (s) => { const [m, sec] = s.split(':').map(Number); return m * 60 + sec; };
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rand(a.length)];
  const hexRgb = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => {
    const pa = hexRgb(a), pb = hexRgb(b);
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const BG = '#090909';
  function cover(color, seed, cls) {
    return h('span', { class: 'cover' + (cls ? ' ' + cls : ''), vars: { '--c1': color, '--c2': mix(color, BG, 0.6), '--rot': (seed * 47) % 180 + 90 } });
  }
  const setRange = (input) => {
    const max = Number(input.max) || 100, min = Number(input.min) || 0;
    input.style.setProperty('--p', ((Number(input.value) - min) / (max - min || 1)) * 100 + '%');
  };
  const timeNow = (offsetMin = 0) => new Date(Date.now() - offsetMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  function store(key, val) { try { if (val === undefined) return sessionStorage.getItem(key); sessionStorage.setItem(key, val); } catch (e) { return null; } return null; }

  /* ------------------------------------------------------------------ */
  /* Data (all invented)                                                */
  /* ------------------------------------------------------------------ */
  const ME = { handle: '@alexmusic', name: 'Alex M.', av: 'A', color: '#1DB954' };
  const GENRES = {
    afrobeats: { label: 'Afrobeats', color: '#FF8F3F' },
    hiphop: { label: 'Hip-hop', color: '#F25F5C' },
    rnb: { label: 'R&B and soul', color: '#9B8CFF' },
    pop: { label: 'Pop', color: '#E56BD6' },
    lofi: { label: 'Lo-fi', color: '#6FD3B0' },
    jazz: { label: 'Jazz', color: '#5AA9F6' },
    electronic: { label: 'Electronic', color: '#35D0E6' },
    latin: { label: 'Latin', color: '#FF6F91' },
  };
  const PALETTE = Object.values(GENRES).map((g) => g.color);

  const MEMBERS = [
    { handle: '@alexmusic', name: 'Alex M.', av: 'A', color: '#1DB954', active: true },
    { handle: '@jazzlover99', name: 'Jazz', av: 'J', color: '#8DBBFF', active: true },
    { handle: '@beatmaster', name: 'Beat M.', av: 'B', color: '#FF8A8A', active: true },
    { handle: '@soulvibes', name: 'Soul V.', av: 'S', color: '#F59E6B', active: true },
    { handle: '@naijanation', name: 'Naija N.', av: 'N', color: '#C79BFF', active: false },
    { handle: '@nightowl22', name: 'Night Owl', av: 'N', color: '#6FD3B0', active: true },
    { handle: '@melodymaven', name: 'Melody M.', av: 'M', color: '#FF7EB6', active: true },
    { handle: '@bassline99', name: 'Bass Line', av: 'B', color: '#5AA9F6', active: true },
  ];

  const TRACKS = [
    { title: 'Essence', artist: 'Wizkid ft. Tems', dur: '3:47', votes: 12, addedBy: '@alexmusic', color: '#FF8F3F' },
    { title: 'Love Story', artist: 'Taylor Swift', dur: '3:55', votes: 9, addedBy: '@jazzlover99', color: '#E56BD6' },
    { title: 'HUMBLE.', artist: 'Kendrick Lamar', dur: '2:57', votes: 8, addedBy: '@beatmaster', color: '#F25F5C' },
    { title: 'Golden', artist: 'Jill Scott', dur: '5:18', votes: 6, addedBy: '@soulvibes', color: '#9B8CFF' },
    { title: 'Goat', artist: 'Bloody Civilian', dur: '3:21', votes: 4, addedBy: '@naijanation', color: '#6FD3B0' },
    { title: "Creepin'", artist: 'Metro Boomin ft. The Weeknd', dur: '3:36', votes: 3, addedBy: '@nightowl22', color: '#5AA9F6' },
  ];
  const SONG_SAMPLES = [
    { title: 'Essence', artist: 'Wizkid ft. Tems', dur: '3:47' },
    { title: 'Blinding Lights', artist: 'The Weeknd', dur: '3:20' },
    { title: 'Peaches', artist: 'Justin Bieber', dur: '3:18' },
    { title: 'Mood', artist: '24kGoldn ft. iann dior', dur: '2:21' },
    { title: 'Montero', artist: 'Lil Nas X', dur: '2:18' },
    { title: 'drivers license', artist: 'Olivia Rodrigo', dur: '4:02' },
    { title: 'Leave The Door Open', artist: 'Bruno Mars', dur: '4:02' },
    { title: 'Golden', artist: 'Jill Scott', dur: '5:18' },
    { title: 'Rich Flex', artist: 'Drake ft. 21 Savage', dur: '3:56' },
    { title: 'Ojuelegba', artist: 'Wizkid', dur: '3:37' },
  ];
  const FOLLOWERS = [
    { handle: '@musicfan2026', name: 'Music Fan', color: '#8DBBFF' },
    { handle: '@djstreet_nyc', name: 'DJ Street', color: '#C79BFF' },
    { handle: '@beatboxer99', name: 'Beat Boxer', color: '#F59E6B' },
    { handle: '@vibeout_only', name: 'Vibe Out', color: '#6FD3B0' },
    { handle: '@thecoolkid__', name: 'The Cool Kid', color: '#FF7EB6' },
  ];

  function room(id, name, host, genre, listeners, reactions, songs, playing, privacy, space, hot, trending, tags, description) {
    return { id, name, host, genre, listeners, reactions, songs, playing, privacy, space, hot, trending, tags, description, color: GENRES[genre].color, av: host.charAt(1).toUpperCase() };
  }
  const ROOMS = [
    room(1, 'Friday Night Vibes', '@alexmusic', 'afrobeats', 247, 1840, 34, ['Essence', 'Wizkid ft. Tems'], 'public', true, true, true, ['afrobeats', 'naija', 'chill'], 'The biggest Afrobeats room on X every Friday. Open to all.'),
    room(2, 'Hip-Hop Cypher Room', '@beatmaster', 'hiphop', 198, 1230, 28, ['HUMBLE.', 'Kendrick Lamar'], 'public', true, true, true, ['hiphop', 'rap', 'bars'], 'A daily cypher. Bring bars, not egos.'),
    room(3, 'Late Night R&B Lounge', '@soulvibes', 'rnb', 156, 980, 22, ['Golden', 'Jill Scott'], 'request', false, false, true, ['r&b', 'soul', 'late night'], 'R&B after midnight. The host approves every guest.'),
    room(4, 'Lo-Fi Study Hall', '@chillwave', 'lofi', 423, 2100, 89, ['Rainy Day Study', 'Various artists'], 'public', false, true, true, ['lofi', 'study', 'focus'], 'The biggest study room on SoundRoom. Always open.'),
    room(5, 'Swifties World Tour', '@melodymaven', 'pop', 312, 3200, 44, ['Love Story', 'Taylor Swift'], 'public', true, true, false, ['taylor', 'pop', 'swifties'], 'A listening party for every era. All fans welcome.'),
    room(6, 'Afrobeats All Day', '@naijanation', 'afrobeats', 189, 1100, 31, ['Ojuelegba', 'Wizkid'], 'public', true, false, true, ['afrobeats', 'naija', 'highlife'], 'Non-stop Afrobeats from Lagos to London.'),
    room(7, 'Jazz After Dark', '@jazzlover99', 'jazz', 67, 420, 15, ['So What', 'Miles Davis'], 'request', false, false, false, ['jazz', 'blues', 'smooth'], 'Curated jazz for slow evenings. The host approves every guest.'),
    room(8, 'Electronic Pulse', '@djstreet_nyc', 'electronic', 134, 760, 19, ['One More Time', 'Daft Punk'], 'public', true, false, false, ['edm', 'house', 'techno'], 'Electronic from house to techno, all night.'),
    room(9, 'VIP R&B Vault', '@quietstorm', 'rnb', 22, 310, 8, ['Adorn', 'Miguel'], 'private', false, false, false, ['r&b', 'private', 'vip'], 'A private room. Members only.'),
    room(10, 'Latin Heat', '@salsaking', 'latin', 201, 1560, 37, ['Tití Me Preguntó', 'Bad Bunny'], 'public', true, true, true, ['latin', 'reggaeton', 'bachata'], 'Latin music around the clock. Come dance.'),
    room(11, 'UK Rap Corner', '@grime_god', 'hiphop', 88, 530, 14, ['Shutdown', 'Skepta'], 'public', false, false, false, ['ukrap', 'grime', 'drill'], 'The best of UK rap, grime and drill.'),
    room(12, 'Midnight Pop', '@nightowl22', 'pop', 95, 670, 18, ['Levitating', 'Dua Lipa'], 'public', false, false, false, ['pop', 'indie', 'midnight'], 'Pop bangers for night owls.'),
  ];

  const CHAT_REPLIES = ['This one!', 'Turn it up', 'Play it again', 'Who added this? Love it', 'Facts', 'Yes!!', 'The sync is so smooth', 'Best room on X tonight'];
  const AUTO_CHAT = ['This beat hits', 'Someone add more Wizkid please', 'Never leaving this room', 'The sync is so smooth', 'Best room on X tonight', 'Who added that last track?'];

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */
  const state = {
    page: 'overview', tab: 'trending', side: 'chat', genre: null,
    x: false, sp: false, busy: false,
    rooms: ROOMS.map((r) => ({ ...r })),
    requests: [{ roomId: 3, status: 'pending', time: '12 minutes ago' }],
    room: null, members: [], listeners: 0,
    now: null, up: [], history: [],
    playing: false, progress: 0, shuffle: false, repeat: false, liked: false,
    mic: true, canSpeak: true, rx: 47, chat: [], reqRoom: null, sessionStart: Date.now(),
  };
  let uid = 100;
  const findRoom = (id) => state.rooms.find((r) => r.id === id);
  const isHost = (r) => r.host === ME.handle;
  const playingText = (r) => (r.playing ? r.playing[0] + ' by ' + r.playing[1] : 'Nothing playing yet');
  const requestFor = (id) => state.requests.find((q) => q.roomId === id);

  /* ------------------------------------------------------------------ */
  /* Toasts                                                             */
  /* ------------------------------------------------------------------ */
  function toast(msg, type = 'info') {
    const wrap = $('#toasts');
    while (wrap.children.length >= 3) wrap.children[0].remove();
    const ic = { success: 'check', warning: 'alert', info: 'info', song: 'music', notification: 'bell' }[type] || 'info';
    const el = h('div', { class: 'toast ' + type }, icon(ic), h('span', null, msg),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Dismiss notification', on: { click: () => el.remove() } }, icon('close')));
    wrap.append(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 4600);
  }

  /* ------------------------------------------------------------------ */
  /* Routing                                                            */
  /* ------------------------------------------------------------------ */
  const PAGES = ['overview', 'rooms', 'room', 'connect', 'architecture', 'proposal'];
  const TITLES = {
    overview: 'SoundRoom: a concept for listening together on X with Spotify',
    rooms: 'Rooms | SoundRoom', room: 'Live room | SoundRoom', connect: 'Connect accounts | SoundRoom',
    architecture: 'How it would be built | SoundRoom', proposal: 'Feature concept | SoundRoom',
  };
  const hashFor = (p) => '#/' + (p === 'overview' ? '' : p);
  const pageFromHash = () => {
    const m = location.hash.replace(/^#\/?/, '').split('?')[0];
    return PAGES.includes(m) ? m : 'overview';
  };
  function go(page) {
    if (location.hash === hashFor(page) || (page === 'overview' && (location.hash === '' || location.hash === '#'))) show(page, true);
    else location.hash = hashFor(page);
  }
  function navigate(page) { // used by the tour: no history entries
    history.replaceState(null, '', hashFor(page));
    show(page, false);
  }
  function show(page, focus) {
    if (page === 'room' && !state.room) enterRoom(findRoom(1));
    const changed = state.page !== page;
    state.page = page;
    $$('.page').forEach((p) => { p.hidden = p.dataset.page !== page; });
    $$('.tab').forEach((t) => {
      if (t.dataset.page === page) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    document.title = TITLES[page];
    if (changed) window.scrollTo(0, 0);
    if (page === 'rooms') renderRooms();
    else if (page === 'room') renderRoom();
    else if (page === 'connect') renderConnect();
    if (focus) { const hd = $('#page-' + page + ' h1'); if (hd) hd.focus({ preventScroll: true }); }
    measureHeader();
  }
  function measureHeader() {
    const t = $('#top');
    if (t) document.documentElement.style.setProperty('--header-h', t.offsetHeight + 'px');
  }

  /* ------------------------------------------------------------------ */
  /* Dialog helpers                                                     */
  /* ------------------------------------------------------------------ */
  function initDialogs() {
    $$('dialog.modal').forEach((d) => {
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
      $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Overview                                                           */
  /* ------------------------------------------------------------------ */
  function initHero() {
    const seats = $('#heroSeats');
    MEMBERS.forEach((m, i) => {
      seats.append(h('span', { class: 'seat' + (i === 0 || i === 2 ? ' speaking' : ''), vars: { '--a': i * 45 + 'deg', '--c': m.color, '--i': i } }, m.av));
    });
    $('#heroRecord').addEventListener('click', () => floatEmoji($('#heroFloat'), pick(['🔥', '🎵', '❤️', '🙌']), false));
  }
  function floatEmoji(layer, emoji, fixed) {
    if (reduceMotion) return;
    const el = h('span', { class: 'rx-float' + (fixed ? ' fixed' : ''), vars: { '--x': fixed ? 12 + Math.random() * 60 + 'vw' : 25 + Math.random() * 50 + '%' } }, emoji);
    layer.append(el);
    setTimeout(() => el.remove(), 2100);
  }

  /* ------------------------------------------------------------------ */
  /* Rooms hub                                                          */
  /* ------------------------------------------------------------------ */
  function privacyMeta(p) {
    return p === 'public' ? { label: 'Public', ic: 'globe' } : p === 'request' ? { label: 'Request to join', ic: 'key' } : { label: 'Private', ic: 'lock' };
  }
  function privacyChip(r, pos) {
    const m = privacyMeta(r.privacy);
    return h('span', { class: 'chip ' + r.privacy + (pos ? ' ' + pos : '') }, icon(m.ic), m.label);
  }
  function ctaFor(r) {
    const req = requestFor(r.id);
    if (r.privacy === 'public' || isHost(r)) return { label: 'Join', go: true };
    if (r.privacy === 'request') {
      if (req && req.status === 'approved') return { label: 'Enter', go: true };
      if (req && req.status === 'pending') return { label: 'Requested', go: false };
      return { label: 'Request', go: false };
    }
    return { label: 'Invite only', go: false };
  }
  function filtered(list) {
    const q = $('#globalSearch').value.trim().toLowerCase();
    const sort = $('#sortSelect').value;
    const out = list.filter((r) => !q || [r.name, r.genre, r.host, GENRES[r.genre].label, ...r.tags].some((s) => s.toLowerCase().includes(q)));
    if (sort === 'listeners') out.sort((a, b) => b.listeners - a.listeners);
    else if (sort === 'reactions') out.sort((a, b) => b.reactions - a.reactions);
    else if (sort === 'songs') out.sort((a, b) => b.songs - a.songs);
    else out.sort((a, b) => b.id - a.id);
    return out;
  }
  function emptyState(title, text) { return h('div', { class: 'empty' }, h('b', null, title), text); }

  function roomCard(r) {
    const cta = ctaFor(r);
    return h('article', { class: 'sleeve' },
      h('div', { class: 'sleeve-art' },
        cover(r.color, r.id),
        h('span', { class: 'chip tl' }, h('i', { class: 'live-dot', 'aria-hidden': 'true' }), 'Live'),
        privacyChip(r, 'tr'),
        h('span', { class: 'chip bl' }, icon('users'), fmt(r.listeners))),
      h('div', null,
        h('h3', null, h('button', { class: 'stretch', type: 'button', on: { click: () => joinOrRequest(r.id) } }, r.name)),
        h('p', { class: 'meta' }, 'Hosted by ' + r.host, r.mine ? h('span', { class: 'mine-tag' }, ' (you)') : null)),
      h('p', { class: 'meta now' }, icon('music'), h('span', null, playingText(r))),
      h('div', { class: 'sleeve-foot' },
        h('span', { class: 'meta' }, fmt(r.reactions) + ' reactions'),
        h('span', { class: 'cta' + (cta.go ? ' go' : '') }, cta.label)));
  }
  function featuredCard(r) {
    const cta = ctaFor(r);
    return h('article', { class: 'featured', vars: { '--c1': r.color } },
      h('div', { class: 'cover-box' }, cover(r.color, r.id)),
      h('div', null,
        h('div', { class: 'meta' }, h('span', { class: 'live' }, h('i', { class: 'live-dot', 'aria-hidden': 'true' }), 'Live now'), ' ', privacyChip(r)),
        h('h3', null, h('button', { class: 'stretch', type: 'button', on: { click: () => joinOrRequest(r.id) } }, r.name)),
        h('p', null, r.description),
        h('div', { class: 'stats' },
          h('span', null, icon('users'), fmt(r.listeners) + ' listening'),
          h('span', null, icon('flame'), fmt(r.reactions) + ' reactions'),
          h('span', null, icon('music'), r.songs + ' songs played'),
          r.space ? h('span', null, icon('radio'), 'X Space live') : null),
        h('p', { class: 'meta now' }, icon('music'), h('span', null, 'Now playing: ' + playingText(r))),
        h('span', { class: 'cta' + (cta.go ? ' go' : '') }, cta.label)));
  }
  function renderTrending() {
    const list = filtered(state.rooms.filter((r) => r.trending || r.hot));
    const feat = clear($('#featuredRoom')), grid = clear($('#trendingGrid'));
    if (!list.length) { feat.append(emptyState('No rooms match', 'Try another word, or clear the search.')); return; }
    feat.append(featuredCard(list[0]));
    list.slice(1).forEach((r) => grid.append(roomCard(r)));
  }
  function renderTop() {
    const g = state.genre;
    $('#topTitle').textContent = g ? 'Top ' + GENRES[g].label + ' rooms' : 'Top rooms this week';
    $('#clearGenre').hidden = !g;
    const list = filtered(state.rooms.filter((r) => !g || r.genre === g));
    const ol = clear($('#topList'));
    if (!list.length) { ol.append(h('li', null, emptyState('No rooms match', 'Try another word, or clear the search.'))); return; }
    list.forEach((r, i) => {
      const cta = ctaFor(r);
      ol.append(h('li', { class: 'toprow' },
        h('span', { class: 'rank' + (i < 3 ? ' r' + (i + 1) : '') }, String(i + 1)),
        h('span', { class: 'thumb' }, cover(r.color, r.id, 'sm')),
        h('div', { style: null },
          h('h3', null, h('button', { class: 'stretch', type: 'button', on: { click: () => joinOrRequest(r.id) } }, r.name), privacyChip(r)),
          h('p', { class: 'meta now' }, icon('music'), h('span', null, playingText(r)))),
        h('div', { class: 'numbers' }, h('span', null, fmt(r.listeners) + ' listening'), h('span', { class: 'soft' }, fmt(r.reactions) + ' reactions')),
        h('span', { class: 'cta' + (cta.go ? ' go' : '') }, cta.label)));
    });
    $$('.toprow .thumb').forEach((t) => { t.style.aspectRatio = '1'; });
  }
  function renderCategories() {
    const grid = clear($('#catGrid'));
    Object.entries(GENRES).forEach(([key, g], i) => {
      const rooms = state.rooms.filter((r) => r.genre === key);
      const listeners = rooms.reduce((n, r) => n + r.listeners, 0);
      const top = rooms.slice().sort((a, b) => b.listeners - a.listeners)[0];
      grid.append(h('button', { class: 'tile', type: 'button', on: { click: () => { state.genre = key; setTab('top', true); } } },
        cover(g.color, i + 3, 'wide'),
        h('span', { class: 'body' },
          h('span', { class: 'h3' }, g.label),
          h('span', { class: 'meta' }, rooms.length + (rooms.length === 1 ? ' room, ' : ' rooms, ') + fmt(listeners) + ' listening'),
          top ? h('span', { class: 'meta' }, 'Busiest: ' + top.name) : null)));
    });
  }
  function renderForYou() {
    const tags = ['afrobeats', 'r&b', 'hip-hop', 'lo-fi'];
    const t = clear($('#forYouTags'));
    tags.forEach((x) => t.append(h('li', { class: 'tag' }, x)));
    const grid = clear($('#forYouGrid'));
    const list = filtered(state.rooms.filter((r) => ['afrobeats', 'rnb', 'hiphop', 'lofi'].includes(r.genre)));
    if (!list.length) grid.append(emptyState('No rooms match', 'Try another word, or clear the search.'));
    list.forEach((r) => grid.append(roomCard(r)));
  }
  function renderRequests() {
    const box = clear($('#requestsList'));
    if (!state.requests.length) {
      box.append(emptyState('No requests yet', 'Open a room marked "Request to join" and ask the host to let you in.'));
      return;
    }
    state.requests.forEach((q) => {
      const r = findRoom(q.roomId);
      const st = { pending: ['clock', 'Waiting for host'], approved: ['check', 'Approved'], denied: ['close', 'Declined'] }[q.status];
      let action = h('span');
      if (q.status === 'pending') action = h('button', { class: 'btn ghost sm', type: 'button', on: { click: () => approveRequest(q.roomId) } }, 'Simulate host approval');
      if (q.status === 'approved') action = h('button', { class: 'btn primary sm', type: 'button', on: { click: () => openRoom(r) } }, 'Enter room');
      box.append(h('div', { class: 'req' },
        h('span', { class: 'thumb' }, cover(r.color, r.id, 'sm')),
        h('div', null, h('b', null, r.name), h('p', { class: 'meta' }, 'Requested ' + q.time + ' from ' + r.host)),
        h('span', { class: 'status ' + q.status }, icon(st[0]), st[1]),
        action));
    });
    $$('.req .thumb').forEach((t) => { t.style.aspectRatio = '1'; });
  }
  function updateBadge() {
    const n = state.requests.filter((q) => q.status === 'pending').length;
    const b = $('#pendingBadge');
    b.textContent = String(n);
    b.hidden = n === 0;
    $('#tabDot').hidden = n === 0;
  }
  function setTab(name, keepGenre) {
    if (name !== 'top' || !keepGenre) { if (name !== 'top') state.genre = null; }
    state.tab = name;
    $$('#roomTabs [role="tab"]').forEach((b) => {
      const on = b.dataset.tab === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    $$('.panel').forEach((p) => { p.hidden = p.id !== 'panel-' + name; });
    $('#roomsToolbar').hidden = name === 'categories' || name === 'requests';
    if (state.page === 'rooms') renderPanel();
  }
  function renderPanel() {
    ({ trending: renderTrending, top: renderTop, categories: renderCategories, foryou: renderForYou, requests: renderRequests })[state.tab]();
  }
  function renderRooms() { updateBadge(); setTab(state.tab, true); }
  function initRooms() {
    const btns = $$('#roomTabs [role="tab"]');
    btns.forEach((b, i) => {
      b.addEventListener('click', () => setTab(b.dataset.tab));
      b.addEventListener('keydown', (e) => {
        let j = -1;
        if (e.key === 'ArrowRight') j = (i + 1) % btns.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + btns.length) % btns.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = btns.length - 1;
        if (j >= 0) { e.preventDefault(); btns[j].focus(); setTab(btns[j].dataset.tab); }
      });
    });
    $('#globalSearch').addEventListener('input', renderPanel);
    $('#sortSelect').addEventListener('change', renderPanel);
    $('#clearGenre').addEventListener('click', () => { state.genre = null; renderPanel(); });
  }

  /* ---------- Join and request ---------- */
  function joinOrRequest(id) {
    const r = findRoom(id);
    if (!r) return;
    if (r.privacy === 'public' || isHost(r)) return openRoom(r);
    if (r.privacy === 'request') {
      const q = requestFor(id);
      if (q && q.status === 'approved') return openRoom(r);
      return openRequest(r);
    }
    toast('This room is private. You need an invite from the host.', 'warning');
  }
  function openRoom(r) {
    if (!state.room || state.room.id !== r.id) enterRoom(r);
    go('room');
    toast('You joined ' + r.name, 'success');
  }
  function openRequest(r) {
    state.reqRoom = r;
    const q = requestFor(r.id);
    $('#rjTitle').textContent = 'Request to join';
    $('#rjDesc').textContent = r.host + ' approves every guest. You will hear back here and on X.';
    const info = clear($('#rjRoomInfo'));
    info.append(h('span', { class: 'thumb' }, cover(r.color, r.id, 'sm')),
      h('div', null, h('b', null, r.name), h('p', { class: 'meta' }, fmt(r.listeners) + ' listening, ' + playingText(r))));
    info.firstChild.style.aspectRatio = '1';
    $('#rjNote').value = '';
    const pending = !!q && q.status === 'pending';
    $('#rjForm').hidden = pending; $('#rjFootForm').hidden = pending;
    $('#rjPending').hidden = !pending; $('#rjFootPending').hidden = !pending;
    const d = $('#dlgRequest');
    if (!d.open) d.showModal();
  }
  function sendRequest() {
    const r = state.reqRoom;
    if (!r) return;
    state.requests.unshift({ roomId: r.id, status: 'pending', time: 'just now' });
    updateBadge();
    $('#rjForm').hidden = true; $('#rjFootForm').hidden = true;
    $('#rjPending').hidden = false; $('#rjFootPending').hidden = false;
    toast('Request sent to ' + r.host, 'notification');
  }
  function approveRequest(roomId) {
    const q = requestFor(roomId), r = findRoom(roomId);
    if (!q || !r) return;
    q.status = 'approved';
    updateBadge();
    $('#dlgRequest').close();
    toast(r.host + ' approved your request. You can join now.', 'success');
    state.tab = 'requests';
    go('rooms');
    if (state.page === 'rooms') setTab('requests');
  }

  /* ---------- Create room ---------- */
  function openCreate() {
    const d = $('#dlgCreate');
    $('#newRoomError').hidden = true;
    $('#newRoomName').removeAttribute('aria-invalid');
    if (!d.open) d.showModal();
    $('#newRoomName').focus();
  }
  function initCreate() {
    const sel = $('#newRoomGenre');
    Object.entries(GENRES).forEach(([k, g]) => sel.append(h('option', { value: k }, g.label)));
    const max = $('#maxListeners');
    max.addEventListener('input', () => { $('#maxVal').textContent = max.value; setRange(max); });
    setRange(max);
    $('#createForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#newRoomName');
      const name = input.value.trim();
      if (!name) {
        $('#newRoomError').hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      const genre = sel.value;
      const privacy = $('input[name="privacy"]:checked', e.target).value;
      const r = room(++uid, name, ME.handle, genre, 1, 0, 0, null, privacy, $('#spaceSwitch').checked, false, true, [genre, 'new'], 'Your new room');
      r.mine = true; r.fresh = true; r.max = Number(max.value);
      state.rooms.unshift(r);
      $('#dlgCreate').close();
      e.target.reset();
      $('#maxVal').textContent = '50'; setRange(max);
      enterRoom(r);
      go('room');
      toast('"' + name + '" is live. Share the invite link to get listeners.', 'success');
      if (r.space) setTimeout(() => toast('Your X Space has started.', 'notification'), 1400);
    });
    $('#newRoomName').addEventListener('input', () => { $('#newRoomError').hidden = true; $('#newRoomName').removeAttribute('aria-invalid'); });
  }

  /* ------------------------------------------------------------------ */
  /* Live room                                                          */
  /* ------------------------------------------------------------------ */
  function membersFor(r) {
    if (r.fresh) return [{ ...MEMBERS[0], role: 'host', speaking: true }];
    const list = MEMBERS.map((m) => ({ ...m, role: 'member', speaking: false }));
    let host = list.find((m) => m.handle === r.host);
    if (!host) {
      host = { handle: r.host, name: r.host.slice(1), av: r.host.charAt(1).toUpperCase(), color: r.color, active: true, role: 'member', speaking: false };
      list.unshift(host);
    }
    host.role = 'host'; host.active = true; host.speaking = true;
    const guest = list.find((m) => m.active && m !== host && m.handle !== ME.handle);
    if (guest) guest.speaking = true;
    return list;
  }
  function buildQueue(r) {
    uid += 1;
    state.history = [];
    if (r.fresh) { state.now = null; state.up = []; return; }
    const base = TRACKS.map((t, i) => ({ ...t, id: 'b' + r.id + '-' + i, my: 0 }));
    if (r.id === 1) { state.now = base.shift(); state.up = base; return; }
    state.now = { id: 'n' + r.id, title: r.playing[0], artist: r.playing[1], dur: '3:30', votes: 5, my: 0, addedBy: r.host, color: r.color };
    state.up = base.filter((t) => t.title !== state.now.title).slice(0, 5);
  }
  function enterRoom(r) {
    state.room = r;
    state.members = membersFor(r);
    buildQueue(r);
    state.progress = r.id === 1 ? 83 : 0;
    state.playing = !!state.now;
    state.liked = false;
    state.canSpeak = isHost(r);
    state.mic = isHost(r);
    state.rx = r.id === 1 ? 47 : Math.round(r.reactions / 40);
    state.listeners = r.listeners;
    state.sessionStart = Date.now() - (r.fresh ? 0 : (r.id === 1 ? 83 : 20 + rand(70)) * 60000);
    state.chat = [];
    if (r.id === 1) {
      [['@jazzlover99', 'this song is EVERYTHING', 4], ['@beatmaster', 'Wizkid never misses', 3], ['@soulvibes', 'added Golden, trust me', 2], ['@alexmusic', 'love the energy tonight', 1]]
        .forEach(([u, m, ago]) => pushChat({ user: u, msg: m, time: timeNow(ago), host: u === ME.handle }, true));
    } else {
      pushChat({ sys: true, msg: 'You joined ' + r.name }, true);
    }
    if (state.page === 'room') renderRoom();
  }
  const memberOf = (handle) => state.members.find((m) => m.handle === handle);

  function renderRoom() {
    const r = state.room;
    $('#roomName').textContent = r.name;
    const pc = $('#roomPrivacy'); const pm = privacyMeta(r.privacy);
    clear(pc).append(icon(pm.ic), pm.label); pc.className = 'chip ' + r.privacy;
    $('#roomSpaceChip').hidden = !r.space;
    $('#listenerCnt').textContent = fmt(state.listeners);
    renderSpace(); renderPlayer(); renderQueue(); renderChatAll(); renderMembers(); renderStats();
    setSide(state.side);
    $('#rxCnt').textContent = String(state.rx);
  }

  /* ---------- Space ---------- */
  function renderSpace() {
    const r = state.room;
    $('#spaceLive').hidden = !r.space;
    $('#spaceEmpty').hidden = r.space;
    $('#startSpaceBtn').hidden = !isHost(r);
    $('#roomSpaceChip').hidden = !r.space;
    const empty = $('#spaceEmpty p');
    empty.textContent = isHost(r) ? 'No X Space is running in this room. Start one so listeners can talk.' : 'No X Space is running in this room. Ask the host to start one.';
    if (!r.space) return;
    const row = clear($('#speakersRow'));
    state.members.filter((m) => (m.handle === ME.handle ? state.canSpeak : m.speaking)).forEach((m) => {
      const talking = m.handle === ME.handle ? state.mic : true;
      row.append(h('div', { class: 'speaker' + (talking ? ' talking' : '') },
        h('span', { class: 'av', vars: { '--c': m.color, '--s': '48px' } }, m.av),
        h('span', { class: 'handle', title: m.role === 'host' ? m.handle + ' (host)' : m.handle }, m.handle),
        talking ? h('span', { class: 'vbars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')) : h('span', { class: 'meta' }, 'muted')));
    });
    const lr = clear($('#listenersRow'));
    const active = state.members.filter((m) => m.active);
    lr.append('Listening');
    active.slice(0, 5).forEach((m) => lr.append(h('span', { class: 'av', vars: { '--c': m.color, '--s': '24px' }, title: m.handle }, m.av)));
    const more = state.listeners - Math.min(5, active.length);
    if (more > 0) lr.append(h('span', { style: null }, ' +' + fmt(more) + ' more'));
    const mic = $('#micBtn');
    mic.disabled = !state.canSpeak;
    mic.setAttribute('aria-pressed', String(state.canSpeak && state.mic));
    clear(mic).append(icon(state.canSpeak && state.mic ? 'mic' : 'mic-off'), h('span', null, !state.canSpeak ? 'Listener' : state.mic ? 'Mic on' : 'Mic off'));
    $('#handBtn').hidden = state.canSpeak;
  }

  /* ---------- Player ---------- */
  function renderPlayer() {
    const t = state.now;
    $('#trackName').textContent = t ? t.title : 'Nothing playing';
    $('#artistName').textContent = t ? t.artist : 'Add a song to start the room';
    $('#totTime').textContent = t ? t.dur : '0:00';
    const seek = $('#seek');
    seek.max = String(t ? parseDur(t.dur) : 100);
    seek.disabled = !t;
    $('#vinyl').style.setProperty('--c1', t ? t.color : '#1DB954');
    $('#vinyl').classList.toggle('paused', !state.playing);
    $('#eq').classList.toggle('paused', !state.playing);
    const pb = $('#playBtn');
    pb.disabled = !t;
    pb.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
    $('#playIcon use').setAttribute('href', state.playing ? '#i-pause' : '#i-play');
    $('#prevBtn').disabled = !t; $('#nextBtn').disabled = !t;
    const like = $('#likeBtn');
    like.disabled = !t;
    like.setAttribute('aria-pressed', String(state.liked));
    $('#shuffleBtn').setAttribute('aria-pressed', String(state.shuffle));
    $('#repeatBtn').setAttribute('aria-pressed', String(state.repeat));
    updateProgress();
  }
  function updateProgress() {
    const seek = $('#seek');
    seek.value = String(Math.round(state.progress));
    setRange(seek);
    $('#curTime').textContent = mmss(state.progress);
  }
  function tick() {
    if (document.hidden || state.page !== 'room' || !state.playing || !state.now) return;
    state.progress += 0.5;
    if (state.progress >= parseDur(state.now.dur)) onTrackEnd();
    else updateProgress();
  }
  function onTrackEnd() {
    if (state.repeat) { state.progress = 0; updateProgress(); return; }
    nextTrack(true);
  }
  function startTrack(t, announce) {
    state.now = t; state.progress = 0; state.playing = true; state.liked = false;
    renderPlayer(); renderQueue(); renderStats();
    if (announce) addChat({ sys: true, msg: 'Now playing: ' + t.title + ' by ' + t.artist });
  }
  function nextTrack() {
    if (!state.now) return;
    const cur = state.now;
    if (!state.up.length) {
      if (state.history.length) state.up = state.history.splice(0).map((t) => ({ ...t, votes: 0, my: 0 }));
      else { state.progress = parseDur(cur.dur); state.playing = false; renderPlayer(); toast('That was the last song. Add more to keep the room going.', 'info'); return; }
    }
    state.history.push(cur);
    startTrack(state.up.shift(), true);
  }
  function prevTrack() {
    if (!state.now) return;
    if (state.progress > 3 || !state.history.length) { state.progress = 0; updateProgress(); return; }
    state.up.unshift(state.now);
    startTrack(state.history.pop(), true);
  }
  function playFromQueue(id) {
    const i = state.up.findIndex((t) => t.id === id);
    if (i < 0) return;
    if (state.now) state.history.push(state.now);
    startTrack(state.up.splice(i, 1)[0], true);
  }
  function initPlayer() {
    $('#playBtn').addEventListener('click', () => { if (!state.now) return; state.playing = !state.playing; renderPlayer(); });
    $('#nextBtn').addEventListener('click', nextTrack);
    $('#prevBtn').addEventListener('click', prevTrack);
    $('#seek').addEventListener('input', (e) => { state.progress = Number(e.target.value); updateProgress(); });
    const vol = $('#volume');
    vol.addEventListener('input', () => setRange(vol)); setRange(vol);
    $('#shuffleBtn').addEventListener('click', () => {
      state.shuffle = !state.shuffle;
      if (state.shuffle) {
        for (let i = state.up.length - 1; i > 0; i--) { const j = rand(i + 1); [state.up[i], state.up[j]] = [state.up[j], state.up[i]]; }
        renderQueue();
        toast('Queue shuffled for this session.', 'info');
      }
      renderPlayer();
    });
    $('#repeatBtn').addEventListener('click', () => { state.repeat = !state.repeat; renderPlayer(); toast(state.repeat ? 'This song will repeat.' : 'Repeat is off.', 'info'); });
    $('#likeBtn').addEventListener('click', () => {
      state.liked = !state.liked; renderPlayer();
      if (state.liked) toast('Added to your Liked Songs on Spotify (simulated).', 'success');
    });
    $('#micBtn').addEventListener('click', () => { state.mic = !state.mic; renderSpace(); toast(state.mic ? 'Your mic is on.' : 'Your mic is off.', 'info'); });
    $('#handBtn').addEventListener('click', () => {
      toast('Hand raised. The host can invite you to speak.', 'info');
      $('#handBtn').disabled = true;
      setTimeout(() => {
        if (state.page !== 'room' || state.canSpeak) return;
        state.canSpeak = true; state.mic = false;
        $('#handBtn').disabled = false;
        renderSpace();
        toast(state.room.host + ' invited you to speak. Turn your mic on when you are ready.', 'notification');
      }, 2600);
    });
    $('#startSpaceBtn').addEventListener('click', () => {
      state.room.space = true; state.mic = true; state.canSpeak = true;
      renderRoom();
      toast('Your X Space has started.', 'success');
    });
    $('#inviteBtn').addEventListener('click', openInvite);
    $('#saveSpotify').addEventListener('click', () => toast('Saved as a Spotify playlist (simulated, nothing was created).', 'success'));
    $('#postX').addEventListener('click', () => toast('Shared on X (simulated, nothing was posted).', 'success'));
  }

  /* ---------- Queue ---------- */
  function renderQueue() {
    const list = clear($('#queueList'));
    $('#queueTitle').textContent = 'Up next (' + state.up.length + ')';
    $('#queueEmpty').hidden = !!state.now || state.up.length > 0;
    if (state.now) {
      const t = state.now;
      list.append(h('li', { class: 'qrow is-now' },
        h('span', { class: 'thumb' }, cover(t.color, t.title.length, 'sm'), icon(state.playing ? 'play' : 'pause')),
        h('div', null, h('h3', null, t.title), h('p', { class: 'meta' }, t.artist + ', added by ' + t.addedBy)),
        h('span', { class: 'meta' }, 'Now playing'),
        h('span', { class: 'dur' }, t.dur)));
    }
    state.up.forEach((t) => {
      list.append(h('li', { class: 'qrow' },
        h('span', { class: 'thumb' }, cover(t.color, t.title.length, 'sm')),
        h('div', null,
          h('h3', null, h('button', { class: 'stretch', type: 'button', 'aria-label': 'Play ' + t.title + ' now', on: { click: () => playFromQueue(t.id) } }, t.title)),
          h('p', { class: 'meta' }, t.artist + ', added by ' + t.addedBy)),
        h('div', { class: 'votes' },
          h('button', { type: 'button', 'aria-label': 'Vote up ' + t.title, 'aria-pressed': String(t.my === 1), on: { click: () => vote(t.id, 1) } }, icon('up')),
          h('b', { 'aria-label': t.votes + ' votes' }, String(t.votes)),
          h('button', { type: 'button', 'aria-label': 'Vote down ' + t.title, 'aria-pressed': String(t.my === -1), on: { click: () => vote(t.id, -1) } }, icon('down'))),
        h('span', { class: 'dur' }, t.dur)));
    });
    $$('.qrow .thumb').forEach((t) => { t.style.aspectRatio = '1'; });
  }
  function vote(id, dir) {
    const t = state.up.find((x) => x.id === id);
    if (!t) return;
    const next = t.my === dir ? 0 : dir;
    t.votes += next - t.my; t.my = next;
    state.up.sort((a, b) => b.votes - a.votes);
    renderQueue();
  }
  function addTrack(song) {
    const dupe = [state.now, ...state.up].some((t) => t && t.title === song.title && t.artist === song.artist);
    if (dupe) { toast('That song is already in the queue.', 'warning'); return; }
    const t = { id: 't' + (++uid), title: song.title, artist: song.artist, dur: song.dur, votes: 1, my: 1, addedBy: ME.handle, color: pick(PALETTE) };
    $('#dlgSong').close();
    if (!state.now) { startTrack(t, false); }
    else { state.up.push(t); state.up.sort((a, b) => b.votes - a.votes); renderQueue(); }
    addChat({ sys: true, msg: ME.handle + ' added "' + t.title + '" to the queue' });
    toast('"' + t.title + '" added to the queue.', 'success');
    setTimeout(() => {
      const mine = state.up.find((x) => x.id === t.id);
      if (!mine || state.page !== 'room') return;
      mine.votes += 1; state.up.sort((a, b) => b.votes - a.votes); renderQueue();
      toast('@jazzlover99 voted up "' + t.title + '".', 'notification');
    }, 2200);
  }
  function renderSongResults() {
    const q = $('#songSearch').value.trim().toLowerCase();
    const inQueue = new Set([state.now, ...state.up].filter(Boolean).map((t) => t.title + '|' + t.artist));
    let res = SONG_SAMPLES;
    $('#songHint').textContent = q ? '' : 'Suggested for this room';
    if (q) res = res.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    else res = res.filter((s) => !inQueue.has(s.title + '|' + s.artist)).slice(0, 5);
    const ul = clear($('#songResults'));
    if (!res.length) { ul.append(h('li', null, emptyState('No songs found', q ? 'Nothing matches "' + q + '". Try a different spelling.' : 'Everything suggested is already queued.'))); return; }
    res.forEach((s, i) => ul.append(h('li', { class: 'res' },
      h('span', { class: 'thumb' }, cover(PALETTE[(s.title.length + i) % PALETTE.length], s.title.length, 'sm')),
      h('div', null, h('b', null, s.title), h('span', { class: 'meta' }, s.artist)),
      h('span', { class: 'meta' }, s.dur),
      h('button', { class: 'btn sm', type: 'button', 'aria-label': 'Add ' + s.title + ' by ' + s.artist, on: { click: () => addTrack(s) } }, 'Add'))));
    $$('#songResults .thumb').forEach((t) => { t.style.aspectRatio = '1'; });
  }
  function initQueue() {
    $('#addSongBtn').addEventListener('click', () => {
      $('#songSearch').value = '';
      renderSongResults();
      $('#dlgSong').showModal();
      $('#songSearch').focus();
    });
    $('#songSearch').addEventListener('input', renderSongResults);
    $$('#reactionsBar [data-rx]').forEach((b) => b.addEventListener('click', () => {
      state.rx += 1; $('#rxCnt').textContent = String(state.rx);
      floatEmoji(document.body, b.dataset.rx, true);
    }));
  }

  /* ---------- Chat ---------- */
  function chatNode(m) {
    if (m.sys) return h('p', { class: 'sys' }, m.msg);
    const mem = memberOf(m.user) || (m.user === ME.handle ? ME : null);
    const color = mem ? mem.color : '#8c8c8c';
    return h('div', { class: 'msg' },
      h('span', { class: 'av', vars: { '--c': color, '--s': '28px' }, 'aria-hidden': 'true' }, m.user.charAt(1).toUpperCase()),
      h('div', null,
        h('div', { class: 'msg-head', vars: { '--c': color } }, h('b', null, m.user), m.host ? h('span', { class: 'host-tag' }, 'Host') : null, h('time', null, m.time)),
        h('p', null, m.msg)));
  }
  function pushChat(m, silent) {
    m.time = m.time || timeNow();
    state.chat.push(m);
    if (state.chat.length > 150) state.chat.shift();
    if (silent) return;
  }
  function addChat(m) {
    pushChat(m);
    if (state.page !== 'room') return;
    const box = $('#chatMsgs');
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
    box.append(chatNode(m));
    while (box.children.length > 150) box.firstChild.remove();
    if (near || m.mine) box.scrollTop = box.scrollHeight;
  }
  function renderChatAll() {
    const box = clear($('#chatMsgs'));
    state.chat.forEach((m) => box.append(chatNode(m)));
    box.scrollTop = box.scrollHeight;
  }
  function typingFor(handle, ms) {
    const t = $('#typingEl');
    clear(t).append(handle + ' is typing', h('i'), h('i'), h('i'));
    setTimeout(() => clear(t), ms);
  }
  function initChat() {
    const form = $('#chatForm'), input = $('#chatInput');
    const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 84) + 'px'; };
    input.addEventListener('input', grow);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;
      addChat({ user: ME.handle, msg, host: isHost(state.room), mine: true });
      input.value = ''; grow();
      const others = state.members.filter((m) => m.active && m.handle !== ME.handle);
      if (!others.length) return;
      const who = pick(others);
      setTimeout(() => typingFor(who.handle, 1300), 500);
      setTimeout(() => { if (state.page === 'room') addChat({ user: who.handle, msg: pick(CHAT_REPLIES) }); }, 1800);
    });
  }

  /* ---------- Members, stats, side tabs ---------- */
  function renderMembers() {
    const box = clear($('#side-members'));
    const active = state.members.filter((m) => m.active), idle = state.members.filter((m) => !m.active);
    const row = (m, away) => h('div', { class: 'member' + (away ? ' idle' : '') },
      h('span', { class: 'av', vars: { '--c': m.color, '--s': '32px' }, 'aria-hidden': 'true' }, m.av),
      h('div', { class: 'names' }, h('b', null, m.name, m.role === 'host' ? h('span', { class: 'host-tag' }, 'Host') : null), h('span', { class: 'meta' }, m.handle + (away ? ', away' : ''))));
    box.append(h('p', { class: 'group-title' }, 'In the room (' + active.length + ')'), ...active.map((m) => row(m, false)));
    if (idle.length) box.append(h('p', { class: 'group-title' }, 'Away (' + idle.length + ')'), ...idle.map((m) => row(m, true)));
    if (state.listeners > active.length) box.append(h('p', { class: 'meta' }, '+' + fmt(state.listeners - active.length) + ' more listening'));
  }
  function renderStats() {
    const r = state.room, t = state.now;
    $('#statTrack').textContent = t ? t.title + ', ' + t.artist : 'Nothing played yet';
    $('#statTrackSub').textContent = t ? 'Played ' + (r.id === 1 ? 3 : 1) + (r.id === 1 ? ' times, ' : ' time, ') + state.rx + ' reactions' : 'Add a song to get started';
    const mins = Math.floor((Date.now() - state.sessionStart) / 60000);
    $('#statSession').textContent = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm';
    $('#statSessionSub').textContent = (r.fresh ? 0 : 12) + state.history.length + ' songs, ' + fmt(state.listeners) + ' listeners';
    const bars = clear($('#activityWave'));
    [30, 40, 60, 35, 80, 55, 95, 65, 45, 75, 60, 90, 55, 100, 70].forEach((v, i) => bars.append(h('i', { vars: { '--h': v + '%', '--i': i } })));
  }
  function setSide(name) {
    state.side = name;
    $$('.side-tabs [role="tab"]').forEach((b) => {
      const on = b.dataset.side === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    ['chat', 'members', 'stats'].forEach((n) => { $('#side-' + n).hidden = n !== name; });
  }
  function initSide() {
    const btns = $$('.side-tabs [role="tab"]');
    btns.forEach((b, i) => {
      b.addEventListener('click', () => setSide(b.dataset.side));
      b.addEventListener('keydown', (e) => {
        let j = -1;
        if (e.key === 'ArrowRight') j = (i + 1) % btns.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + btns.length) % btns.length;
        if (j >= 0) { e.preventDefault(); btns[j].focus(); setSide(btns[j].dataset.side); }
      });
    });
  }

  /* ---------- Invite ---------- */
  function openInvite() {
    const link = 'soundroom.example/r/' + state.room.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    $('#inviteLink').value = link;
    FOLLOWERS.forEach((f) => { f.sent = false; });
    renderInviteList();
    $('#dlgInvite').showModal();
  }
  function renderInviteList() {
    const ul = clear($('#inviteList'));
    FOLLOWERS.forEach((f) => ul.append(h('li', { class: 'res', style: null },
      h('span', { class: 'av', vars: { '--c': f.color, '--s': '36px' }, 'aria-hidden': 'true' }, f.name.charAt(0)),
      h('div', null, h('b', null, f.name), h('span', { class: 'meta' }, f.handle)),
      h('span'),
      h('button', { class: 'btn sm' + (f.sent ? ' primary' : ''), type: 'button', 'aria-pressed': String(!!f.sent), 'aria-label': (f.sent ? 'Remove invite for ' : 'Invite ') + f.name, on: { click: () => { f.sent = !f.sent; renderInviteList(); } } }, f.sent ? 'Selected' : 'Invite'))));
  }
  function initInvite() {
    $('#copyLink').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('#inviteLink').value); toast('Link copied (demo link).', 'success'); }
      catch (e) { $('#inviteLink').select(); toast('Press Ctrl+C to copy the link.', 'info'); }
    });
    $('#sendInvites').addEventListener('click', () => {
      const n = FOLLOWERS.filter((f) => f.sent).length;
      if (!n) { toast('Pick at least one person to invite.', 'warning'); return; }
      $('#dlgInvite').close();
      toast('Invites sent to ' + n + (n === 1 ? ' person' : ' people') + ' by DM (simulated).', 'success');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Connect                                                            */
  /* ------------------------------------------------------------------ */
  function renderConnect() {
    const sx = $('#step-x'), ss = $('#step-sp'), sd = $('#step-done');
    sx.classList.toggle('is-active', !state.x); sx.classList.toggle('is-done', state.x);
    $('#btnX').hidden = state.x; $('#btnX').disabled = state.busy; $('#btnX').textContent = state.busy && !state.x ? 'Connecting...' : 'Connect X';
    $('#xDone').hidden = !state.x;
    ss.setAttribute('aria-disabled', String(!state.x));
    ss.classList.toggle('is-active', state.x && !state.sp);
    $('#btnSp').hidden = state.sp; $('#btnSp').disabled = !state.x || state.busy; $('#btnSp').textContent = state.busy && state.x && !state.sp ? 'Connecting...' : 'Connect Spotify';
    $('#spDone').hidden = !state.sp;
    const ready = state.x && state.sp;
    sd.setAttribute('aria-disabled', String(!ready));
    sd.classList.toggle('is-active', ready);
    $('#btnFinish').disabled = !ready;
  }
  function initConnect() {
    const link = (key, label, msg) => () => {
      if (state.busy) return;
      state.busy = true; renderConnect();
      setTimeout(() => { state[key] = true; state.busy = false; renderConnect(); toast(msg, 'success'); }, 1100);
    };
    $('#btnX').addEventListener('click', link('x', 'X', 'Connected to X as @alexmusic (demo account).'));
    $('#btnSp').addEventListener('click', link('sp', 'Spotify', 'Connected to Spotify Premium (demo account).'));
    $('#btnFinish').addEventListener('click', () => { go('rooms'); toast('Accounts linked. Welcome to SoundRoom.', 'success'); });
    $('#btnReset').addEventListener('click', () => { state.x = false; state.sp = false; state.busy = false; renderConnect(); toast('Demo reset. Start again from step one.', 'info'); });
  }

  /* ------------------------------------------------------------------ */
  /* Tour                                                               */
  /* ------------------------------------------------------------------ */
  const TOUR = [
    { page: 'overview', title: 'Welcome to SoundRoom', desc: 'A short walk through the prototype. Use the buttons or the arrow keys, and press Escape to leave at any time.' },
    { page: 'overview', sel: '.tab[data-page="connect"]', title: 'Link your accounts', desc: 'Everything starts with X and Spotify Premium. The Connect page shows exactly what SoundRoom asks for, and what it never touches.' },
    { page: 'overview', sel: '.tab[data-page="rooms"]', title: 'Find a room', desc: 'Rooms lists everything live: trending, top ranked, by genre and picked for you.' },
    { page: 'overview', sel: '#createBtn', title: 'Start your own', desc: 'Pick a genre, decide who can join, and start an X Space if you want voice.' },
    { page: 'rooms', sel: '#tab-top', before: () => setTab('top'), title: 'Top rooms', desc: 'A weekly ranking by listeners, reactions and songs played.' },
    { page: 'rooms', sel: '#tab-categories', before: () => setTab('categories'), title: 'Browse by genre', desc: 'Choose a genre to see every room playing it.' },
    { page: 'rooms', sel: '#tab-requests', before: () => setTab('requests'), title: 'Ask to join', desc: 'Some hosts approve each guest. Your requests wait here until the host answers.' },
    { page: 'room', sel: '#spacePanel', title: 'Voice from X Spaces', desc: 'The room\'s Space runs alongside the music, so speakers can talk over the song.' },
    { page: 'room', sel: '#playerCard', title: 'One song, one room', desc: 'Everyone plays the same track on their own Spotify Premium. The service keeps them in step.' },
    { page: 'room', sel: '#queueCard', title: 'Queue and reactions', desc: 'Add songs, vote them up and send reactions that float across everyone\'s screen.' },
    { page: 'architecture', title: 'That is the tour', desc: 'How it works shows the build, and the Proposal makes the case. Create a room to try it yourself.' },
  ];
  let tourI = 0, tourOpen = false;
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  function startTour() {
    tourI = 0; tourOpen = true;
    $('#tour').hidden = false;
    tourStep();
  }
  function endTour() {
    tourOpen = false;
    $('#tour').hidden = true;
    $('#tourSpot').hidden = true;
    const b = $('#tourBtn'); if (b) b.focus();
  }
  async function tourStep() {
    const s = TOUR[tourI];
    if (s.page && state.page !== s.page) navigate(s.page);
    if (s.before) s.before();
    await frame();
    $('#tourStep').textContent = 'Step ' + (tourI + 1) + ' of ' + TOUR.length;
    $('#tourTitle').textContent = s.title;
    $('#tourDesc').textContent = s.desc;
    $('#tourBack').hidden = tourI === 0;
    $('#tourNext').textContent = tourI === TOUR.length - 1 ? 'Finish' : 'Next';
    const dots = clear($('#tourDots'));
    TOUR.forEach((_, i) => dots.append(h('i', { class: i === tourI ? 'on' : i < tourI ? 'past' : '' })));
    const t = s.sel ? $(s.sel) : null;
    if (t) {
      const r = t.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 20) { t.scrollIntoView({ block: 'center' }); await frame(); }
    }
    placeTour();
    $('#tourTitle').focus({ preventScroll: true });
  }
  function placeTour() {
    if (!tourOpen) return;
    const s = TOUR[tourI], spot = $('#tourSpot'), card = $('#tourCard'), block = $('#tourBlock');
    const t = s.sel ? $(s.sel) : null;
    const vw = window.innerWidth, vh = window.innerHeight;
    card.style.translate = ''; card.style.top = 'auto'; card.style.bottom = 'auto'; card.style.left = 'auto'; card.style.right = 'auto';
    if (!t || t.offsetParent === null && getComputedStyle(t).position !== 'fixed') {
      spot.hidden = true; block.classList.add('dim');
      card.style.left = '50%'; card.style.top = '50%'; card.style.translate = '-50% -50%';
      return;
    }
    block.classList.remove('dim');
    const r = t.getBoundingClientRect();
    spot.hidden = false;
    spot.style.left = r.left - 6 + 'px'; spot.style.top = r.top - 6 + 'px';
    spot.style.width = r.width + 12 + 'px'; spot.style.height = r.height + 12 + 'px';
    const ch = card.offsetHeight, cw = card.offsetWidth;
    card.style.left = Math.max(12, Math.min(r.left, vw - cw - 12)) + 'px';
    if (r.bottom + 16 + ch < vh) card.style.top = r.bottom + 16 + 'px';
    else if (r.top - 16 - ch > 0) card.style.top = r.top - 16 - ch + 'px';
    else card.style.bottom = '12px';
  }
  function initTour() {
    $('#tourBtn').addEventListener('click', startTour);
    $('#tourNext').addEventListener('click', () => { if (tourI < TOUR.length - 1) { tourI++; tourStep(); } else endTour(); });
    $('#tourBack').addEventListener('click', () => { if (tourI > 0) { tourI--; tourStep(); } });
    $('#tourSkip').addEventListener('click', endTour);
    document.addEventListener('keydown', (e) => {
      if (!tourOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); endTour(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); $('#tourNext').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); $('#tourBack').click(); }
      else if (e.key === 'Tab') {
        const f = $$('#tourCard button').filter((b) => !b.hidden);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === $('#tourTitle'))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    let raf = 0;
    const again = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(placeTour); };
    window.addEventListener('resize', again);
    window.addEventListener('scroll', again, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Ambient simulation (only while visible)                            */
  /* ------------------------------------------------------------------ */
  function startSimulation() {
    setInterval(tick, 500);
    setInterval(() => {
      if (document.hidden || state.page !== 'room' || !state.room || state.room.fresh) return;
      const others = state.members.filter((m) => m.active && m.handle !== ME.handle);
      if (!others.length) return;
      const who = pick(others);
      addChat({ user: who.handle, msg: pick(AUTO_CHAT) });
    }, 9000);
    setInterval(() => {
      if (document.hidden || (state.page !== 'room' && state.page !== 'rooms') || Math.random() > 0.3) return;
      if (state.page === 'room' && state.room && !state.room.fresh) {
        const who = pick(state.members.filter((m) => m.handle !== ME.handle));
        toast(who.handle + ' joined the room.', 'notification');
        state.listeners += 1; $('#listenerCnt').textContent = fmt(state.listeners);
        addChat({ sys: true, msg: who.handle + ' joined' });
      }
    }, 14000);
    setInterval(() => {
      if (document.hidden) return;
      if (state.page === 'room' && state.room && !state.room.fresh) {
        state.listeners = Math.max(8, state.listeners + (Math.random() > 0.5 ? 1 : -1));
        $('#listenerCnt').textContent = fmt(state.listeners);
      }
      if (state.page === 'rooms') {
        $('#liveRoomCount').textContent = fmt(247 + rand(10) - 5);
        $('#liveUserCount').textContent = fmt(18432 + rand(100) - 50);
      }
    }, 4000);
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  function boot() {
    initDialogs(); initHero(); initRooms(); initCreate(); initPlayer(); initQueue(); initChat(); initSide();
    initInvite(); initConnect(); initTour();

    $('#createBtn').addEventListener('click', openCreate);
    $('#rjSend').addEventListener('click', sendRequest);
    $('#rjApprove').addEventListener('click', () => state.reqRoom && approveRequest(state.reqRoom.id));
    $('#printBtn').addEventListener('click', () => window.print());
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      if (a.dataset.action === 'create') openCreate();
      else if (a.dataset.action === 'demo-request') joinOrRequest(7);
    });

    const notice = $('#notice');
    if (store('sr-notice') === 'closed') notice.hidden = true;
    $('#noticeClose').addEventListener('click', () => { notice.hidden = true; store('sr-notice', 'closed'); measureHeader(); });

    window.addEventListener('hashchange', () => show(pageFromHash(), true));
    window.addEventListener('resize', measureHeader);
    show(pageFromHash(), false);
    startSimulation();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
