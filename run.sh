#!/usr/bin/env bash
# Usage: ./run.sh        build and start the game at http://localhost:8080
#        ./run.sh test   build and run the rule tests
set -euo pipefail
cd "$(dirname "$0")"

# Needs Java 17 or newer. On macOS, pick one automatically if available.
if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  JAVA_HOME="$(/usr/libexec/java_home -v 17+ 2>/dev/null || echo "${JAVA_HOME:-}")"
fi
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/}"

mkdir -p out
"${JAVA_BIN}javac" --release 17 -d out $(find src/main/java -name '*.java')
cp -R src/main/resources/. out/

case "${1:-run}" in
  run)
    exec "${JAVA_BIN}java" -cp out undercover.Main
    ;;
  test)
    mkdir -p out-test
    "${JAVA_BIN}javac" --release 17 -cp out -d out-test $(find src/test/java -name '*.java')
    "${JAVA_BIN}java" -cp out:out-test undercover.GameTest
    ;;
  *)
    echo "Usage: $0 [run|test]" >&2
    exit 1
    ;;
esac
