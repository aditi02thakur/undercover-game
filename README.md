# Undercover (pass-and-play)

A single-device version of the party game Undercover with Civilians and Undercovers.

**Play online:** https://aditi02thakur.github.io/undercover-game/

## How to play

1. Enter 3 to 20 player names and choose how many Undercovers (always fewer than Civilians).
2. Pass the device around. Each player taps to see their secret word, then hides it.
3. Each round, players say one clue about their word in the order shown.
4. Everyone discusses and votes out loud, then taps the player who got the most votes.
   That player's role is revealed.
5. Civilians win when every Undercover is out. Undercovers win when only one Civilian is left.

## Web version (`docs/`, hosted on GitHub Pages)

Runs entirely in the browser, with no server. Each browser tab has its own game, saved in
`sessionStorage` so a page refresh doesn't lose it.

```
docs/index.html   page
docs/game.js      game rules and word pairs
docs/app.js       screens
docs/style.css    styles
test/game.test.js rule tests
```

```bash
node --test test/                                          # run the rule tests
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs   # try it locally at http://localhost:8000
```

To add word pairs, edit `WORD_PAIRS` in `docs/game.js`.

## Java version (`src/`, local only)

The original version, with a Java 17 backend (JDK built-in HTTP server, no libraries).
It keeps one shared game in server memory, so it's meant for running on your own machine.

```bash
./run.sh          # then open http://localhost:8080
./run.sh test     # run the Java rule tests
```
