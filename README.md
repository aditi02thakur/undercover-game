# Undercover (pass-and-play)

A local, single-device version of the party game Undercover with Civilians and Undercovers.
The backend is plain Java 17 with no external libraries. The frontend is plain HTML/CSS/JS.

## Run

```bash
./run.sh          # then open http://localhost:8080
./run.sh test     # run the game-rule tests
PORT=9000 ./run.sh
```

The server listens on `127.0.0.1` only, so only this computer can reach it.

## How to play

1. Enter 3 to 20 player names and choose how many Undercovers (always fewer than Civilians).
2. Pass the device around. Each player taps to see their secret word, then hides it.
3. Each round, players say one clue about their word in the order shown.
4. Everyone discusses and votes out loud, then taps the player who got the most votes.
   That player's role is revealed.
5. Civilians win when every Undercover is out. Undercovers win when only one Civilian is left.

## Layout

```
src/main/java/undercover/
  Main.java        HTTP server (JDK built-in), static files + JSON API
  Game.java        Game rules and state
  GameJson.java    State -> JSON (hides roles and words until they should be seen)
  WordPairs.java   Built-in word pairs
src/main/resources/static/   index.html, app.js, style.css
src/test/java/undercover/GameTest.java
```

## API

| Method | Path | Body (form-encoded) | Purpose |
|---|---|---|---|
| GET | `/api/state` | | Current game state |
| POST | `/api/new` | `name` (repeated), `undercovers` | Start a game |
| GET | `/api/word` | | Word for the player currently revealing |
| POST | `/api/reveal/done` | | Current player has seen their word |
| POST | `/api/eliminate` | `player` (index) | Vote a player out |

POST requests must send an `X-Requested-With` header, which stops other websites from
posting to the local server.

To add word pairs, edit `WordPairs.java`.
