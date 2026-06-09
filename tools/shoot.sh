#!/usr/bin/env bash
# Run the Playwright screenshot harness with the locally-extracted Chromium
# system libs (installed without root into ~/.pw-deps). Usage: tools/shoot.sh <port> [screens...]
set -e
D="$HOME/.pw-deps"
LIBDIRS=$(find "$D/root" -name '*.so*' -printf '%h\n' | sort -u | tr '\n' ':')
export LD_LIBRARY_PATH="${LIBDIRS}${LD_LIBRARY_PATH}"
export FONTCONFIG_FILE="$D/fonts.conf"
cd /home/mini/github/gpu-dashboard
node tools/shoot.mjs "$@"
