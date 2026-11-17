'use strict';

// Rule tests for the browser version. Run with: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../docs/game.js');

// Small deterministic RNG so tests are repeatable.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const names = (n) => Array.from({ length: n }, (_, i) => `Player${i + 1}`);
const indexesOf = (game, role) =>
  game.players.map((p, i) => (p.role === role ? i : -1)).filter((i) => i >= 0);

function startedGame(players, undercovers, seed) {
  const game = G.newGame(names(players), undercovers, { rng: seeded(seed) });
  for (let i = 0; i < players; i++) G.finishReveal(game);
  return game;
}

test('assigns the requested number of undercovers', () => {
  for (let seed = 0; seed < 50; seed++) {
    const game = G.newGame(names(7), 3, { rng: seeded(seed) });
    assert.equal(indexesOf(game, 'UNDERCOVER').length, 3);
    assert.equal(indexesOf(game, 'CIVILIAN').length, 4);
  }
});

test('works with the default crypto RNG', () => {
  const game = G.newGame(names(5), 2);
  assert.equal(indexesOf(game, 'UNDERCOVER').length, 2);
});

test('reveal shows each player once, then moves to clues', () => {
  const game = G.newGame(names(4), 1, { rng: seeded(1) });
  for (let i = 0; i < 4; i++) {
    assert.equal(game.phase, 'REVEAL');
    assert.equal(G.currentRevealPlayer(game), game.players[i]);
    G.finishReveal(game);
  }
  assert.equal(game.phase, 'CLUES');
  assert.throws(() => G.currentRevealPlayer(game));
});

test('each player gets the word for their role, and the words differ', () => {
  const game = G.newGame(names(5), 1, { rng: seeded(2) });
  assert.notEqual(game.civilianWord, game.undercoverWord);
  for (const p of game.players) {
    const expected = p.role === 'UNDERCOVER' ? game.undercoverWord : game.civilianWord;
    assert.equal(G.wordFor(game, p), expected);
  }
});

test('civilians win when all undercovers are out', () => {
  const game = startedGame(6, 2, 3);
  for (const i of indexesOf(game, 'UNDERCOVER')) G.eliminate(game, i, seeded(9));
  assert.equal(game.phase, 'OVER');
  assert.equal(game.winner, 'CIVILIANS');
});

test('undercovers win when only one civilian is left', () => {
  const game = startedGame(5, 1, 4);
  const civilians = indexesOf(game, 'CIVILIAN');
  for (let k = 0; k < civilians.length - 1; k++) {
    assert.equal(game.winner, null);
    G.eliminate(game, civilians[k], seeded(k));
  }
  assert.equal(game.winner, 'UNDERCOVERS');
  assert.equal(game.round, 3);
});

test('speaking order skips eliminated players', () => {
  const game = startedGame(6, 1, 5);
  const civilian = indexesOf(game, 'CIVILIAN')[0];
  G.eliminate(game, civilian, seeded(1));
  const order = G.speakingOrder(game);
  assert.equal(order.length, 5);
  assert.ok(!order.includes(civilian));
});

test('game state survives a JSON round trip (page refresh)', () => {
  const game = startedGame(5, 1, 8);
  const restored = JSON.parse(JSON.stringify(game));
  G.eliminate(restored, indexesOf(restored, 'CIVILIAN')[0], seeded(1));
  assert.equal(restored.round, 2);
});

test('rejects invalid setups', () => {
  assert.throws(() => G.newGame(names(2), 1), /3 to 20 players/);
  assert.throws(() => G.newGame(names(21), 1), /3 to 20 players/);
  assert.throws(() => G.newGame(names(4), 2), /1 to 1 undercovers/);
  assert.throws(() => G.newGame(names(4), 0), /undercovers/);
  assert.throws(() => G.newGame(['Ann', 'ann', 'Bob'], 1), /Two players/);
  assert.throws(() => G.newGame(['Ann', ' ', 'Bob'], 1), /needs a name/);
  assert.throws(() => G.newGame(['Ann', 'Bob', 'x'.repeat(21)], 1), /at most 20/);
});

test('rejects invalid eliminations', () => {
  const notStarted = G.newGame(names(4), 1, { rng: seeded(6) });
  assert.throws(() => G.eliminate(notStarted, 0), /isn't allowed/);

  const game = startedGame(6, 1, 7);
  const civilian = indexesOf(game, 'CIVILIAN')[0];
  G.eliminate(game, civilian, seeded(1));
  assert.throws(() => G.eliminate(game, civilian), /already out/);
  assert.throws(() => G.eliminate(game, 99), /No such player/);
});

test('word pairs: every word is used once and the two words in a pair differ', () => {
  const seen = new Map();
  for (const [a, b] of [...G.WORD_PAIRS, ...G.HARD_WORD_PAIRS]) {
    assert.notEqual(a.toLowerCase(), b.toLowerCase(), `pair ${a}/${b}`);
    for (const word of [a, b]) {
      const key = word.toLowerCase();
      assert.ok(!seen.has(key), `"${word}" appears in both ${seen.get(key)} and ${a}/${b}`);
      seen.set(key, `${a}/${b}`);
    }
  }
});

test('word pairs match the Java version', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const javaSource = fs.readFileSync(
    path.join(__dirname, '../src/main/java/undercover/WordPairs.java'), 'utf8');
  const javaPairs = [...javaSource.matchAll(/\{"([^"]+)", "([^"]+)"\}/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(javaPairs, [...G.WORD_PAIRS, ...G.HARD_WORD_PAIRS]);
});

const isPairFrom = (pairs, game) => pairs.some(([a, b]) =>
  (a === game.civilianWord && b === game.undercoverWord)
  || (b === game.civilianWord && a === game.undercoverWord));

test('normal mode uses only normal pairs', () => {
  for (let seed = 0; seed < 200; seed++) {
    const game = G.newGame(names(4), 1, { rng: seeded(seed) });
    assert.equal(game.hardMode, false);
    assert.ok(isPairFrom(G.WORD_PAIRS, game), `${game.civilianWord}/${game.undercoverWord}`);
  }
});

test('hard mode uses only hard pairs', () => {
  for (let seed = 0; seed < 200; seed++) {
    const game = G.newGame(names(4), 1, { hardMode: true, rng: seeded(seed) });
    assert.equal(game.hardMode, true);
    assert.ok(isPairFrom(G.HARD_WORD_PAIRS, game), `${game.civilianWord}/${game.undercoverWord}`);
  }
});
