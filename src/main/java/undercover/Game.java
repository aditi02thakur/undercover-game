package undercover;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;

/**
 * Rules and state for one pass-and-play game of Undercover (Civilians vs Undercovers).
 * Not thread-safe: callers must synchronize access.
 */
public final class Game {

    public enum Role { CIVILIAN, UNDERCOVER }

    /** REVEAL: players view their words one by one. CLUES: clue + vote rounds. OVER: game finished. */
    public enum Phase { REVEAL, CLUES, OVER }

    public enum Winner { CIVILIANS, UNDERCOVERS }

    public static final int MIN_PLAYERS = 3;
    public static final int MAX_PLAYERS = 20;
    public static final int MAX_NAME_LENGTH = 20;

    public static final class Player {
        private final String name;
        private final Role role;
        private boolean alive = true;

        Player(String name, Role role) {
            this.name = name;
            this.role = role;
        }

        public String name() { return name; }
        public Role role() { return role; }
        public boolean alive() { return alive; }
    }

    private final List<Player> players = new ArrayList<>();
    private final String civilianWord;
    private final String undercoverWord;
    private final Random random;

    private Phase phase = Phase.REVEAL;
    private int revealIndex = 0;
    private int round = 1;
    private int firstSpeaker;
    private Player lastEliminated;
    private Winner winner;

    public Game(List<String> rawNames, int undercoverCount, Random random) {
        List<String> names = validateNames(rawNames);
        int max = maxUndercovers(names.size());
        if (undercoverCount < 1 || undercoverCount > max) {
            throw new IllegalArgumentException(
                    "With " + names.size() + " players you can have 1 to " + max + " undercovers.");
        }
        this.random = random;

        String[] pair = WordPairs.pick(random);
        boolean swap = random.nextBoolean();
        civilianWord = swap ? pair[1] : pair[0];
        undercoverWord = swap ? pair[0] : pair[1];

        List<Role> roles = new ArrayList<>();
        for (int i = 0; i < names.size(); i++) {
            roles.add(i < undercoverCount ? Role.UNDERCOVER : Role.CIVILIAN);
        }
        Collections.shuffle(roles, random);
        for (int i = 0; i < names.size(); i++) {
            players.add(new Player(names.get(i), roles.get(i)));
        }
        firstSpeaker = pickFirstSpeaker();
    }

    /** Undercovers must always be outnumbered by civilians. */
    public static int maxUndercovers(int playerCount) {
        return Math.max(1, (playerCount - 1) / 2);
    }

    private static List<String> validateNames(List<String> rawNames) {
        if (rawNames.size() < MIN_PLAYERS || rawNames.size() > MAX_PLAYERS) {
            throw new IllegalArgumentException(
                    "You need " + MIN_PLAYERS + " to " + MAX_PLAYERS + " players.");
        }
        List<String> names = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String raw : rawNames) {
            String name = raw == null ? "" : raw.trim();
            if (name.isEmpty()) {
                throw new IllegalArgumentException("Every player needs a name.");
            }
            if (name.length() > MAX_NAME_LENGTH) {
                throw new IllegalArgumentException(
                        "Names can be at most " + MAX_NAME_LENGTH + " characters.");
            }
            if (!seen.add(name.toLowerCase(Locale.ROOT))) {
                throw new IllegalArgumentException("Two players are called \"" + name + "\".");
            }
            names.add(name);
        }
        return names;
    }

    /** The player whose turn it is to look at their word. */
    public Player currentRevealPlayer() {
        requirePhase(Phase.REVEAL);
        return players.get(revealIndex);
    }

    public String wordFor(Player player) {
        return player.role == Role.UNDERCOVER ? undercoverWord : civilianWord;
    }

    /** The current player has seen their word; move on to the next one. */
    public void finishReveal() {
        requirePhase(Phase.REVEAL);
        revealIndex++;
        if (revealIndex == players.size()) {
            phase = Phase.CLUES;
        }
    }

    /** Indexes of alive players in the order they give clues this round. */
    public List<Integer> speakingOrder() {
        List<Integer> order = new ArrayList<>();
        for (int offset = 0; offset < players.size(); offset++) {
            int i = (firstSpeaker + offset) % players.size();
            if (players.get(i).alive) {
                order.add(i);
            }
        }
        return order;
    }

    /** Remove the player the group voted out, then check for a winner. */
    public Player eliminate(int index) {
        requirePhase(Phase.CLUES);
        if (index < 0 || index >= players.size()) {
            throw new IllegalArgumentException("No such player.");
        }
        Player player = players.get(index);
        if (!player.alive) {
            throw new IllegalArgumentException(player.name + " is already out.");
        }
        player.alive = false;
        lastEliminated = player;

        long undercoversLeft = countAlive(Role.UNDERCOVER);
        long civiliansLeft = countAlive(Role.CIVILIAN);
        if (undercoversLeft == 0) {
            winner = Winner.CIVILIANS;
        } else if (civiliansLeft <= 1) {
            winner = Winner.UNDERCOVERS;
        }

        if (winner != null) {
            phase = Phase.OVER;
        } else {
            round++;
            firstSpeaker = pickFirstSpeaker();
        }
        return player;
    }

    private long countAlive(Role role) {
        return players.stream().filter(p -> p.alive && p.role == role).count();
    }

    private int pickFirstSpeaker() {
        List<Integer> alive = new ArrayList<>();
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).alive) {
                alive.add(i);
            }
        }
        return alive.get(random.nextInt(alive.size()));
    }

    private void requirePhase(Phase expected) {
        if (phase != expected) {
            throw new IllegalStateException("That action isn't allowed right now (phase is " + phase + ").");
        }
    }

    public Phase phase() { return phase; }
    public int round() { return round; }
    public int revealIndex() { return revealIndex; }
    public List<Player> players() { return Collections.unmodifiableList(players); }
    public Player lastEliminated() { return lastEliminated; }
    public Winner winner() { return winner; }
    public String civilianWord() { return civilianWord; }
    public String undercoverWord() { return undercoverWord; }
}
