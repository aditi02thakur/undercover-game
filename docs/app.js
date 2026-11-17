'use strict';

const G = window.UndercoverGame;
const app = document.getElementById('app');
const STORAGE_KEY = 'undercover-game';

// Setup choices are remembered so "Play again" can reuse them.
let setupNames = ['', '', '', ''];
let setupUndercovers = 1;
let game = loadGame();

const roleLabel = (role) => (role === 'UNDERCOVER' ? 'Undercover' : 'Civilian');

// The game lives in this tab only, so a refresh keeps it but other tabs/devices don't share it.
function loadGame() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveGame() {
  if (game) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  else sessionStorage.removeItem(STORAGE_KEY);
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

// Runs a game action, saves the result and redraws; shows rule errors instead of crashing.
function act(action) {
  try {
    action();
    saveGame();
    render();
  } catch (e) {
    showError(e.message);
  }
}

function render() {
  if (!game) return renderSetup();
  switch (game.phase) {
    case 'REVEAL': return renderReveal();
    case 'CLUES': return renderClues();
    case 'OVER': return renderOver();
    default:
      game = null;
      saveGame();
      return renderSetup();
  }
}

function renderSetup() {
  const max = G.maxUndercovers(setupNames.length);
  setupUndercovers = Math.min(setupUndercovers, max);

  const rows = setupNames.map((name, i) => el('div', { class: 'row' },
    el('input', {
      type: 'text', maxlength: String(G.MAX_NAME_LENGTH), placeholder: `Player ${i + 1}`, value: name,
      oninput: (e) => { setupNames[i] = e.target.value; },
    }),
    setupNames.length > G.MIN_PLAYERS
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
    setupNames.length < G.MAX_PLAYERS
      ? el('button', { class: 'secondary', onclick: () => { setupNames.push(''); renderSetup(); } }, '+ Add player')
      : null,
    el('label', { class: 'row' }, 'Undercovers:', select),
    el('button', { class: 'primary', onclick: startGame }, 'Start game'),
    errorBox(),
  );
}

function startGame() {
  act(() => { game = G.newGame(setupNames, setupUndercovers); });
}

function renderReveal() {
  const player = G.currentRevealPlayer(game);
  show(
    el('p', { class: 'muted' }, `Player ${game.revealIndex + 1} of ${game.players.length}`),
    el('h1', {}, `Pass the device to ${player.name}`),
    el('p', {}, 'Make sure nobody else can see the screen.'),
    el('button', { class: 'primary', onclick: revealWord }, `I'm ${player.name}, show my word`),
    errorBox(),
  );
}

function revealWord() {
  const player = G.currentRevealPlayer(game);
  show(
    el('p', { class: 'muted' }, `${player.name}, your word is`),
    el('div', { class: 'word' }, G.wordFor(game, player)),
    el('p', {}, 'Remember it, then hide it before you pass the device on.'),
    el('button', { class: 'primary', onclick: () => act(() => G.finishReveal(game)) }, 'Got it, hide my word'),
    errorBox(),
  );
}

function eliminatedBanner() {
  if (game.lastEliminated == null) return null;
  const last = game.players[game.lastEliminated];
  return el('div', { class: `banner ${last.role === 'UNDERCOVER' ? 'uc' : ''}` },
    `${last.name} was voted out. They were a ${roleLabel(last.role)}.`);
}

function renderClues() {
  const alive = game.players.map((p, i) => ({ p, i })).filter(({ p }) => p.alive);
  const out = game.players.filter((p) => !p.alive);

  show(
    el('h1', {}, `Round ${game.round}`),
    eliminatedBanner(),
    el('h2', {}, '1. Give your clues'),
    el('p', { class: 'muted' }, 'Each player says one word or short phrase about their word, in this order:'),
    el('ol', {}, ...G.speakingOrder(game).map((i) => el('li', {}, game.players[i].name))),
    el('h2', {}, '2. Vote'),
    el('p', { class: 'muted' },
      'Discuss, then vote out loud. Tap the player with the most votes. On a tie, re-vote between the tied players.'),
    el('div', { class: 'grid' }, ...alive.map(({ p, i }) => el('button', {
      class: 'vote',
      onclick: () => { if (confirm(`Vote out ${p.name}?`)) act(() => G.eliminate(game, i)); },
    }, p.name))),
    out.length
      ? el('p', { class: 'muted' }, `Out: ${out.map((p) => `${p.name} (${roleLabel(p.role)})`).join(', ')}`)
      : null,
    errorBox(),
  );
}

function renderOver() {
  const names = game.players.map((p) => p.name);
  show(
    el('h1', {}, game.winner === 'CIVILIANS' ? 'Civilians win!' : 'Undercovers win!'),
    eliminatedBanner(),
    el('div', { class: 'words' },
      el('div', {}, 'Civilian word', el('strong', {}, game.civilianWord)),
      el('div', { class: 'uc' }, 'Undercover word', el('strong', {}, game.undercoverWord))),
    el('table', {}, ...game.players.map((p) => el('tr', { class: p.role === 'UNDERCOVER' ? 'uc' : '' },
      el('td', {}, p.name),
      el('td', {}, roleLabel(p.role)),
      el('td', {}, p.alive ? 'Survived' : 'Voted out')))),
    el('button', { class: 'primary', onclick: () => { setupNames = names; startGame(); } }, 'Play again (same players)'),
    el('button', {
      class: 'secondary',
      onclick: () => { setupNames = names; game = null; saveGame(); renderSetup(); },
    }, 'Change players'),
    errorBox(),
  );
}

render();
