package undercover;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static java.nio.charset.StandardCharsets.UTF_8;

/**
 * Local web server for the game. Listens on 127.0.0.1 only, so nothing outside this machine
 * can reach it. Serves the static UI and a small JSON API backed by a single in-memory game.
 */
public final class Main {

    private static final String BIND_ADDRESS = "127.0.0.1";
    private static final int DEFAULT_PORT = 8080;
    private static final int MAX_BODY_BYTES = 16 * 1024;
    /** Browsers can't send a custom header cross-site without CORS approval, which we never give. */
    private static final String CSRF_HEADER = "X-Requested-With";

    private static final Map<String, String> STATIC_FILES = Map.of(
            "/", "index.html",
            "/index.html", "index.html",
            "/app.js", "app.js",
            "/style.css", "style.css");

    private final int port;
    private final Random random = new SecureRandom();
    private Game game; // guarded by "this"

    private Main(int port) {
        this.port = port;
    }

    public static void main(String[] args) throws IOException {
        int port = parsePort(System.getenv("PORT"));
        Main app = new Main(port);
        HttpServer server = HttpServer.create(
                new InetSocketAddress(InetAddress.getByName(BIND_ADDRESS), port), 0);
        server.createContext("/api/", app::handleApi);
        server.createContext("/", app::handleStatic);
        server.start();
        System.out.println("Undercover is running at http://localhost:" + port + "  (Ctrl+C to stop)");
    }

    private static int parsePort(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT_PORT;
        }
        int port = Integer.parseInt(value.trim());
        if (port < 1 || port > 65535) {
            throw new IllegalArgumentException("PORT must be between 1 and 65535");
        }
        return port;
    }

    private void handleApi(HttpExchange ex) throws IOException {
        try {
            if (!hasLocalHostHeader(ex)) {
                sendJson(ex, 403, GameJson.error("Forbidden"));
                return;
            }
            boolean isPost = "POST".equals(ex.getRequestMethod());
            if (isPost && ex.getRequestHeaders().getFirst(CSRF_HEADER) == null) {
                sendJson(ex, 403, GameJson.error("Missing " + CSRF_HEADER + " header"));
                return;
            }
            Map<String, List<String>> form = isPost ? readForm(ex) : Map.of();
            String route = ex.getRequestMethod() + " " + ex.getRequestURI().getPath();
            String body;
            synchronized (this) {
                body = route(route, form);
            }
            sendJson(ex, 200, body);
        } catch (RouteNotFoundException e) {
            sendJson(ex, 404, GameJson.error("Not found"));
        } catch (IllegalArgumentException e) {
            sendJson(ex, 400, GameJson.error(e.getMessage()));
        } catch (IllegalStateException e) {
            sendJson(ex, 409, GameJson.error(e.getMessage()));
        } finally {
            ex.close();
        }
    }

    private String route(String route, Map<String, List<String>> form) {
        return switch (route) {
            case "GET /api/state" -> game == null ? GameJson.setup() : GameJson.state(game);
            case "POST /api/new" -> {
                int undercovers = Integer.parseInt(single(form, "undercovers"));
                game = new Game(form.getOrDefault("name", List.of()), undercovers, random);
                yield GameJson.state(game);
            }
            case "GET /api/word" -> GameJson.word(requireGame());
            case "POST /api/reveal/done" -> {
                requireGame().finishReveal();
                yield GameJson.state(game);
            }
            case "POST /api/eliminate" -> {
                requireGame().eliminate(Integer.parseInt(single(form, "player")));
                yield GameJson.state(game);
            }
            default -> throw new RouteNotFoundException();
        };
    }

    private Game requireGame() {
        if (game == null) {
            throw new IllegalStateException("No game has been started.");
        }
        return game;
    }

    private void handleStatic(HttpExchange ex) throws IOException {
        try {
            String file = STATIC_FILES.get(ex.getRequestURI().getPath());
            if (!"GET".equals(ex.getRequestMethod()) || file == null) {
                send(ex, 404, "text/plain; charset=utf-8", "Not found".getBytes(UTF_8));
                return;
            }
            byte[] bytes;
            try (InputStream in = Main.class.getResourceAsStream("/static/" + file)) {
                if (in == null) {
                    throw new IOException("Missing bundled file: " + file);
                }
                bytes = in.readAllBytes();
            }
            send(ex, 200, contentType(file), bytes);
        } finally {
            ex.close();
        }
    }

    /** Rejects requests whose Host isn't this machine, which blocks DNS-rebinding tricks. */
    private boolean hasLocalHostHeader(HttpExchange ex) {
        String host = ex.getRequestHeaders().getFirst("Host");
        return host != null
                && (host.equals("localhost:" + port) || host.equals("127.0.0.1:" + port));
    }

    private static Map<String, List<String>> readForm(HttpExchange ex) throws IOException {
        byte[] bytes;
        try (InputStream in = ex.getRequestBody()) {
            bytes = in.readNBytes(MAX_BODY_BYTES + 1);
        }
        if (bytes.length > MAX_BODY_BYTES) {
            throw new IllegalArgumentException("Request is too large.");
        }
        Map<String, List<String>> form = new HashMap<>();
        String body = new String(bytes, UTF_8);
        if (body.isEmpty()) {
            return form;
        }
        for (String pair : body.split("&")) {
            int eq = pair.indexOf('=');
            String key = URLDecoder.decode(eq < 0 ? pair : pair.substring(0, eq), UTF_8);
            String value = eq < 0 ? "" : URLDecoder.decode(pair.substring(eq + 1), UTF_8);
            form.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
        }
        return form;
    }

    private static String single(Map<String, List<String>> form, String key) {
        List<String> values = form.get(key);
        if (values == null || values.size() != 1) {
            throw new IllegalArgumentException("Expected exactly one '" + key + "' value.");
        }
        return values.get(0);
    }

    private static String contentType(String file) {
        if (file.endsWith(".html")) {
            return "text/html; charset=utf-8";
        }
        if (file.endsWith(".js")) {
            return "text/javascript; charset=utf-8";
        }
        if (file.endsWith(".css")) {
            return "text/css; charset=utf-8";
        }
        return "application/octet-stream";
    }

    private static void sendJson(HttpExchange ex, int status, String json) throws IOException {
        ex.getResponseHeaders().set("Cache-Control", "no-store");
        send(ex, status, "application/json; charset=utf-8", json.getBytes(UTF_8));
    }

    private static void send(HttpExchange ex, int status, String type, byte[] bytes) throws IOException {
        ex.getResponseHeaders().set("Content-Type", type);
        ex.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = ex.getResponseBody()) {
            out.write(bytes);
        }
    }

    private static final class RouteNotFoundException extends RuntimeException {
    }
}
