#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
if [[ "$(uname -m)" != arm64 ]]; then echo 'arm64 macOS is required' >&2; exit 1; fi
NODE_VERSION=v24.22.1
NODE_SHA=89c682593d76cd44233fa53b1563264e7de9cbb189cad169135c5b4fadfbc0a7
NODE_ARCHIVE="$(mktemp /tmp/omnilearn-node.XXXXXX.tar.gz)"
trap 'rm -f "$NODE_ARCHIVE"' EXIT
curl --fail --location --silent --show-error "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-arm64.tar.gz" -o "$NODE_ARCHIVE"
echo "$NODE_SHA  $NODE_ARCHIVE" | shasum -a 256 -c - >/dev/null
NODE_DIR="$(mktemp -d /tmp/omnilearn-node.XXXXXX)"
tar -xzf "$NODE_ARCHIVE" -C "$NODE_DIR"
NODE_BIN="$NODE_DIR/node-$NODE_VERSION-darwin-arm64/bin/node"
if [[ "$(file -b "$NODE_BIN")" != *arm64* ]] || otool -L "$NODE_BIN" | grep -q /opt/homebrew; then echo 'Node payload is not portable arm64' >&2; exit 1; fi
PATH="$(dirname "$NODE_BIN"):$PATH" npm run build
"$NODE_BIN" scripts/build-server.mjs
cargo build --manifest-path src-tauri/Cargo.toml --release
STAGE="$(mktemp -d /tmp/omnilearn-app.XXXXXX)"
trap 'rm -rf "$STAGE" "$NODE_DIR"; rm -f "$NODE_ARCHIVE"' EXIT
APP="$STAGE/Omnilearn.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp src-tauri/target/release/omnilearn-shell "$APP/Contents/MacOS/Omnilearn"
cp "$NODE_BIN" "$APP/Contents/MacOS/node"
cp src-tauri/icons/icon.icns "$APP/Contents/Resources/Omnilearn.icns"
cp -R .next/standalone "$APP/Contents/Resources/server"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Omnilearn</string>
<key>CFBundleDisplayName</key><string>Omnilearn</string>
<key>CFBundleExecutable</key><string>Omnilearn</string>
<key>CFBundleIdentifier</key><string>com.pomidium.omnilearn</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>0.3.2</string>
<key>CFBundleShortVersionString</key><string>0.3.2</string>
<key>CFBundleIconFile</key><string>Omnilearn</string>
<key>LSMinimumSystemVersion</key><string>11.0</string>
</dict></plist>
PLIST
# Install only after the artifact is complete. Preserve any previous bundle intact.
DEST=/Applications/Omnilearn.app
BACKUP="/Applications/Omnilearn.backup.$(date +%Y%m%d-%H%M%S).app"
if [[ -e "$DEST" ]]; then mv "$DEST" "$BACKUP"; fi
if ! cp -R "$APP" "$DEST"; then
  rm -rf "$DEST"
  if [[ -e "$BACKUP" ]]; then mv "$BACKUP" "$DEST"; fi
  exit 1
fi
printf 'Installed unsigned %s (previous bundle: %s)\n' "$DEST" "$BACKUP"
