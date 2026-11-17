'use strict';

const app = document.getElementById('app');
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

// Setup choices are remembered so "Play again" can reuse them.
let setupNames = ['', '', '', ''];
let setupUndercovers = 1;

const maxUndercovers = (n) => Math.max(1, Math.floor((n - 1) / 2));
const roleLabel = (role) => (role === 'UNDERCOVER' ? 'Undercover' : 'Civilian');

async function api(method, path, params) {
  const options = { method, headers: { 'X-Requested-With': 'undercover' } };
  if (params) options.body = new URLSearchParams(params);
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Builds DOM nodes. Text always goes through text nodes, so player names can't inject HTML.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) node[key] = value;
    else if (key === 'class') node.className = value;
    else if (key === 'value') node.value = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child != null) node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

function show(...nodes) {
  app.replaceChildren(...nodes.filter((n) => n != null));
  window.scrollTo(0, 0);
}

const errorBox = () => el('p', { id: 'error', class: 'error' });

function showError(message) {
  const box = document.getElementById('error');
  if (box) box.textContent = message;
  else alert(message);
}

async function act(request) {
  try {
    render(await request());
  } catch (e) {
    showError(e.message);
  }
}

function render(state) {
  switch (state.phase) {
    case 'SETUP': return renderSetup();
    case 'REVEAL': return renderReveal(state);
    case 'CLUES': return renderClues(state);
    case 'OVER': return renderOver(state);
    default: return showError(`Unknown phase ${state.phase}`);
  }
}

function renderSetup() {
  const max = maxUndercovers(setupNames.length);
  setupUndercovers = Math.min(setupUndercovers, max);

  const rows = setupNames.map((name, i) => el('div', { class: 'row' },
    el('input', {
      type: 'text', maxlength: '20', placeholder: `Player ${i + 1}`, value: name,
      oninput: (e) => { setupNames[i] = e.target.value; },
    }),
    setupNames.length > MIN_PLAYERS
      ? el('button', {
        class: 'icon', title: 'Remove player',
        onclick: () => { setupNames.splice(i, 1); renderSetup(); },
      }, '✕')
      : null));

  const select = el('select', { onchange: (e) => { setupUndercovers = Number(e.target.value); } });
  for (let n = 1; n <= max; n++) {
    const option = el('option', { value: String(n) }, String(n));
    if (n === setupUndercovers) option.selected = true;
    select.append(option);
  }

  show(
    el('h1', {}, 'Undercover'),
    el('p', { class: 'muted' },
      'Everyone gets a secret word, except the Undercovers, whose word is slightly different. ' +
      'Give clues, vote someone out, and find the Undercovers before they outlast you.'),
    el('h2', {}, `Players (${setupNames.length})`),
    ...rows,
    setupNames.length < MAX_PLAYERS
      ? el('button', { class: 'secondary', onclick: () => { setupNames.push(''); renderSetup(); } }, '+ Add player')
      : null,
    el('label', { class: 'row' }, 'Undercovers:', select),
    el('button', { class: 'primary', onclick: startGame }, 'Start game'),
    errorBox(),
  );
}

function startGame() {
  const params = setupNames.map((name) => ['name', name.trim()]);
  params.push(['undercovers', String(setupUndercovers)]);
  act(() => api('POST', '/api/new', params));
}

function renderReveal(state) {
  const player = state.players[state.revealIndex];
  show(
    el('p', { class: 'muted' }, `Player ${state.revealIndex + 1} of ${state.players.length}`),
    el('h1', {}, `Pass the device to ${player.name}`),
    el('p', {}, 'Make sure nobody else can see the screen.'),
    el('button', { class: 'primary', onclick: revealWord }, `I'm ${player.name}, show my word`),
    errorBox(),
  );
}

async function revealWord() {
  try {
    const { name, word } = await api('GET', '/api/word');
    show(
      el('p', { class: 'muted' }, `${name}, your word is`),
      el('div', { class: 'word' }, word),
      el('p', {}, 'Remember it, then hide it before you pass the device on.'),
      el('button', { class: 'primary', onclick: () => act(() => api('POST', '/api/reveal/done')) },
        'Got it, hide my word'),
      errorBox(),
    );
  } catch (e) {
    showError(e.message);
  }
}

function eliminatedBanner(state) {
  const last = state.lastEliminated;
  if (!last) return null;
  return el('div', { class: `banner ${last.role === 'UNDERCOVER' ? 'uc' : ''}` },
    `${last.name} was voted out. They were a ${roleLabel(last.role)}.`);
}

function renderClues(state) {
  const alive = state.players.map((p, i) => ({ p, i })).filter(({ p }) => p.alive);
  const out = state.players.filter((p) => !p.alive);

  show(
    el('h1', {}, `Round ${state.round}`),
    eliminatedBanner(state),
    el('h2', {}, '1. Give your clues'),
    el('p', { class: 'muted' }, 'Each player says one word or short phrase about their word, in this order:'),
    el('ol', {}, ...state.speakingOrder.map((i) => el('li', {}, state.players[i].name))),
    el('h2', {}, '2. Vote'),
    el('p', { class: 'muted' },
      'Discuss, then vote out loud. Tap the player with the most votes. On a tie, re-vote between the tied players.'),
    el('div', { class: 'grid' }, ...alive.map(({ p, i }) => el('button', {
      class: 'vote',
      onclick: () => {
        if (confirm(`Vote out ${p.name}?`)) act(() => api('POST', '/api/eliminate', [['player', String(i)]]));
      },
    }, p.name))),
    out.length
      ? el('p', { class: 'muted' }, `Out: ${out.map((p) => `${p.name} (${roleLabel(p.role)})`).join(', ')}`)
      : null,
    errorBox(),
  );
}

function renderOver(state) {
  const names = state.players.map((p) => p.name);
  show(
    el('h1', {}, state.winner === 'CIVILIANS' ? 'Civilians win!' : 'Undercovers win!'),
    eliminatedBanner(state),
    el('div', { class: 'words' },
      el('div', {}, 'Civilian word', el('strong', {}, state.civilianWord)),
      el('div', { class: 'uc' }, 'Undercover word', el('strong', {}, state.undercoverWord))),
    el('table', {}, ...state.players.map((p) => el('tr', { class: p.role === 'UNDERCOVER' ? 'uc' : '' },
      el('td', {}, p.name),
      el('td', {}, roleLabel(p.role)),
      el('td', {}, p.alive ? 'Survived' : 'Voted out')))),
    el('button', { class: 'primary', onclick: () => { setupNames = names; startGame(); } }, 'Play again (same players)'),
    el('button', { class: 'secondary', onclick: () => { setupNames = names; renderSetup(); } }, 'Change players'),
    errorBox(),
  );
}

act(() => api('GET', '/api/state'));
