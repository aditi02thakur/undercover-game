package undercover;

import java.util.List;

/**
 * Turns game state into JSON for the browser. Roles stay hidden until a player is voted out
 * or the game ends, and words are only exposed one player at a time during the reveal phase.
 */
final class GameJson {

    private GameJson() {
    }

    static String setup() {
        return "{\"phase\":\"SETUP\"}";
    }

    static String state(Game game) {
        boolean over = game.phase() == Game.Phase.OVER;
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"phase\":").append(quote(game.phase().name()));
        sb.append(",\"round\":").append(game.round());
        sb.append(",\"revealIndex\":").append(game.revealIndex());

        sb.append(",\"players\":[");
        List<Game.Player> players = game.players();
        for (int i = 0; i < players.size(); i++) {
            Game.Player p = players.get(i);
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"name\":").append(quote(p.name()));
            sb.append(",\"alive\":").append(p.alive());
            if (over || !p.alive()) {
                sb.append(",\"role\":").append(quote(p.role().name()));
            }
            sb.append('}');
        }
        sb.append(']');

        List<Integer> order = game.phase() == Game.Phase.CLUES ? game.speakingOrder() : List.of();
        sb.append(",\"speakingOrder\":[");
        for (int i = 0; i < order.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(order.get(i));
        }
        sb.append(']');

        Game.Player last = game.lastEliminated();
        sb.append(",\"lastEliminated\":");
        if (last == null) {
            sb.append("null");
        } else {
            sb.append("{\"name\":").append(quote(last.name()))
                    .append(",\"role\":").append(quote(last.role().name())).append('}');
        }

        sb.append(",\"winner\":").append(game.winner() == null ? "null" : quote(game.winner().name()));
        if (over) {
            sb.append(",\"civilianWord\":").append(quote(game.civilianWord()));
            sb.append(",\"undercoverWord\":").append(quote(game.undercoverWord()));
        }
        return sb.append('}').toString();
    }

    static String word(Game game) {
        Game.Player player = game.currentRevealPlayer();
        return "{\"name\":" + quote(player.name()) + ",\"word\":" + quote(game.wordFor(player)) + "}";
    }

    static String error(String message) {
        return "{\"error\":" + quote(message == null ? "Unexpected error" : message) + "}";
    }

    static String quote(String value) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20 || c == '<' || c == '>' || c == '&') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.append('"').toString();
    }
}
