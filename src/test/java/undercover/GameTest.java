package undercover;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/** Dependency-free tests for the game rules. Run with: ./run.sh test */
public final class GameTest {

    private static int passed = 0;

    public static void main(String[] args) {
        assignsRequestedNumberOfUndercovers();
        revealPhaseShowsEachPlayerOnceThenStartsClues();
        undercoverAndCivilianWordsDiffer();
        civiliansWinWhenAllUndercoversAreOut();
        undercoversWinWhenOneCivilianIsLeft();
        speakingOrderSkipsEliminatedPlayers();
        rejectsInvalidSetups();
        rejectsInvalidEliminations();
        System.out.println("All " + passed + " tests passed.");
    }

    private static void assignsRequestedNumberOfUndercovers() {
        for (int seed = 0; seed < 50; seed++) {
            Game game = new Game(names(7), 3, new Random(seed));
            check(count(game, Game.Role.UNDERCOVER) == 3, "expected 3 undercovers");
            check(count(game, Game.Role.CIVILIAN) == 4, "expected 4 civilians");
        }
        pass();
    }

    private static void revealPhaseShowsEachPlayerOnceThenStartsClues() {
        Game game = new Game(names(4), 1, new Random(1));
        for (int i = 0; i < 4; i++) {
            check(game.phase() == Game.Phase.REVEAL, "should still be revealing");
            check(game.currentRevealPlayer() == game.players().get(i), "reveal goes in order");
            game.finishReveal();
        }
        check(game.phase() == Game.Phase.CLUES, "should move to clues after all reveals");
        expectThrows(IllegalStateException.class, game::currentRevealPlayer);
        pass();
    }

    private static void undercoverAndCivilianWordsDiffer() {
        Game game = new Game(names(5), 1, new Random(2));
        check(!game.civilianWord().equals(game.undercoverWord()), "words must differ");
        for (Game.Player p : game.players()) {
            String expected = p.role() == Game.Role.UNDERCOVER ? game.undercoverWord() : game.civilianWord();
            check(game.wordFor(p).equals(expected), "player gets the word for their role");
        }
        pass();
    }

    private static void civiliansWinWhenAllUndercoversAreOut() {
        Game game = startedGame(6, 2, 3);
        for (int i : indexesOf(game, Game.Role.UNDERCOVER)) {
            game.eliminate(i);
        }
        check(game.phase() == Game.Phase.OVER, "game should be over");
        check(game.winner() == Game.Winner.CIVILIANS, "civilians should win");
        pass();
    }

    private static void undercoversWinWhenOneCivilianIsLeft() {
        Game game = startedGame(5, 1, 4);
        List<Integer> civilians = indexesOf(game, Game.Role.CIVILIAN);
        for (int k = 0; k < civilians.size() - 1; k++) {
            check(game.winner() == null, "no winner yet");
            game.eliminate(civilians.get(k));
        }
        check(game.winner() == Game.Winner.UNDERCOVERS, "undercover should win");
        check(game.round() == 3, "two rounds played before the winning vote, got " + game.round());
        pass();
    }

    private static void speakingOrderSkipsEliminatedPlayers() {
        Game game = startedGame(6, 1, 5);
        int civilian = indexesOf(game, Game.Role.CIVILIAN).get(0);
        game.eliminate(civilian);
        List<Integer> order = game.speakingOrder();
        check(order.size() == 5, "5 players should speak");
        check(!order.contains(civilian), "eliminated player should not speak");
        pass();
    }

    private static void rejectsInvalidSetups() {
        expectThrows(IllegalArgumentException.class, () -> new Game(names(2), 1, new Random()));
        expectThrows(IllegalArgumentException.class, () -> new Game(names(21), 1, new Random()));
        expectThrows(IllegalArgumentException.class, () -> new Game(names(4), 2, new Random()));
        expectThrows(IllegalArgumentException.class, () -> new Game(names(4), 0, new Random()));
        expectThrows(IllegalArgumentException.class,
                () -> new Game(List.of("Ann", "ann", "Bob"), 1, new Random()));
        expectThrows(IllegalArgumentException.class,
                () -> new Game(List.of("Ann", " ", "Bob"), 1, new Random()));
        expectThrows(IllegalArgumentException.class,
                () -> new Game(List.of("Ann", "Bob", "x".repeat(21)), 1, new Random()));
        pass();
    }

    private static void rejectsInvalidEliminations() {
        Game notStarted = new Game(names(4), 1, new Random(6));
        expectThrows(IllegalStateException.class, () -> notStarted.eliminate(0));

        Game game = startedGame(6, 1, 7);
        int civilian = indexesOf(game, Game.Role.CIVILIAN).get(0);
        game.eliminate(civilian);
        expectThrows(IllegalArgumentException.class, () -> game.eliminate(civilian));
        expectThrows(IllegalArgumentException.class, () -> game.eliminate(99));
        pass();
    }

    // --- helpers ---

    private static Game startedGame(int players, int undercovers, long seed) {
        Game game = new Game(names(players), undercovers, new Random(seed));
        for (int i = 0; i < players; i++) {
            game.finishReveal();
        }
        return game;
    }

    private static List<String> names(int n) {
        List<String> names = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            names.add("Player" + i);
        }
        return names;
    }

    private static long count(Game game, Game.Role role) {
        return game.players().stream().filter(p -> p.role() == role).count();
    }

    private static List<Integer> indexesOf(Game game, Game.Role role) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < game.players().size(); i++) {
            if (game.players().get(i).role() == role) {
                result.add(i);
            }
        }
        return result;
    }

    private static void expectThrows(Class<? extends Throwable> type, Runnable action) {
        try {
            action.run();
        } catch (Throwable t) {
            check(type.isInstance(t), "expected " + type.getSimpleName() + " but got " + t);
            return;
        }
        throw new AssertionError("expected " + type.getSimpleName() + " to be thrown");
    }

    private static void check(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void pass() {
        passed++;
    }
}
