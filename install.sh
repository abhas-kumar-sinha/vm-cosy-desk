#!/usr/bin/env bash
# LovableOS one-shot installer for Ubuntu 22.04+ / Debian 12+.
# Usage:  curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/main/install.sh | sudo bash
set -euo pipefail

REPO_URL="${LOVABLE_OS_REPO:-https://github.com/your-org/lovable-os.git}"
INSTALL_DIR="${LOVABLE_OS_DIR:-/opt/lovable-os}"
PORT="${LOVABLE_OS_PORT:-8080}"

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo)." >&2
  exit 1
fi

echo "==> Installing OS dependencies"
apt-get update
apt-get install -y git curl build-essential python3 libpam0g-dev

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v2* && "$(node -v)" != v20* ]]; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Cloning $REPO_URL into $INSTALL_DIR"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

echo "==> Building web bundle"
cd "$INSTALL_DIR"
npm ci
npm run build

echo "==> Installing agent"
cd "$INSTALL_DIR/agent"
npm ci

echo "==> Writing config"
mkdir -p /etc/lovable-os
if [[ ! -f /etc/lovable-os/config.json ]]; then
  cat > /etc/lovable-os/config.json <<EOF
{
  "port": $PORT,
  "host": "0.0.0.0"
}
EOF
fi

echo "==> Installing systemd unit"
cp "$INSTALL_DIR/agent/systemd/lovable-os.service" /etc/systemd/system/lovable-os.service
systemctl daemon-reload
systemctl enable --now lovable-os

echo
echo "LovableOS is running on http://$(hostname -I | awk '{print $1}'):$PORT"
echo "Log in with your Linux username + password."
